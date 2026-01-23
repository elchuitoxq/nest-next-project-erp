import { Injectable, BadRequestException } from '@nestjs/common';
import { db, loans, loanItems, products, partners } from '@repo/db';
import { eq, desc } from 'drizzle-orm';

@Injectable()
export class LoansService {
  async createLoan(data: {
    partnerId: string;
    items: {
      productId: string;
      quantity: number;
      condition?: string;
      serialNumber?: string;
    }[];
    notes?: string;
    dueDate?: string; // ISO Date String
  }) {
    return await db.transaction(async (tx) => {
      // Check Partner
      const [partner] = await tx
        .select()
        .from(partners)
        .where(eq(partners.id, data.partnerId));
      if (!partner) throw new BadRequestException('Partner not found');

      const [loan] = await tx
        .insert(loans)
        .values({
          code: `PRE-${Date.now()}`,
          partnerId: data.partnerId,
          status: 'ACTIVE',
          notes: data.notes,
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
        })
        .returning();

      for (const item of data.items) {
        await tx.insert(loanItems).values({
          loanId: loan.id,
          productId: item.productId,
          quantity: item.quantity.toString(),
          condition: item.condition || 'GOOD',
          serialNumber: item.serialNumber,
        });

        // Note: Ideally decrase "Available Stock" here, but for MVP we skip
      }

      return loan;
    });
  }

  async findAll() {
    // Simple fetch, usually needs join with Partner to show names
    const allLoans = await db
      .select({
        id: loans.id,
        code: loans.code,
        status: loans.status,
        startDate: loans.startDate,
        partnerName: partners.name,
      })
      .from(loans)
      .leftJoin(partners, eq(loans.partnerId, partners.id))
      .orderBy(desc(loans.createdAt));

    return allLoans;
  }
}
