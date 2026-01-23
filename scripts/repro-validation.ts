import "reflect-metadata";
import { plainToInstance, Type } from "class-transformer";
import {
  validate,
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  IsEnum,
} from "class-validator";

// INLINE CLASSES TO AVOID IMPORT ISSUES

export class InventoryMoveLineDto {
  @IsString()
  productId: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  @IsOptional()
  cost?: number;
}

export class CreateInventoryMoveDto {
  @IsEnum(["IN", "OUT", "TRANSFER", "ADJUST"])
  type: "IN" | "OUT" | "TRANSFER" | "ADJUST";

  @IsString()
  @IsOptional()
  fromWarehouseId?: string;

  @IsString()
  @IsOptional()
  toWarehouseId?: string;

  @IsString()
  @IsOptional()
  note?: string;

  @IsString()
  @IsOptional()
  userId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InventoryMoveLineDto)
  lines: InventoryMoveLineDto[];
}

async function test() {
  const payload = {
    type: "IN",
    toWarehouseId: "019be341-9eec-7b1a-8e90-b06f567f16de",
    note: "Test Move",
    userId: "019...user...",
    lines: [
      {
        productId: "019be33f-ee6a-780b-a32d-8e9c6cfc2221",
        quantity: 10.5,
        cost: 0,
      },
      {
        productId: "019be33f-ee6a-780b-a32d-8e9c6cfc2221",
        quantity: 5,
        cost: 100,
      },
    ],
  };

  console.log("Original Payload:", JSON.stringify(payload, null, 2));

  const object = plainToInstance(CreateInventoryMoveDto, payload);
  console.log("Transformed Object:", JSON.stringify(object, null, 2));
  console.log("Lines count:", object.lines?.length);

  if (object.lines && object.lines.length > 0) {
    console.log(
      "Line 0 instance of DTO?",
      object.lines[0] instanceof InventoryMoveLineDto,
    );
    console.log("Line 0 productId:", object.lines[0].productId);
    console.log(
      "Line 0 quantity:",
      object.lines[0].quantity,
      typeof object.lines[0].quantity,
    );
    console.log(
      "Line 0 cost:",
      object.lines[0].cost,
      typeof object.lines[0].cost,
    );
  }

  const errors = await validate(object, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  if (errors.length > 0) {
    console.log("Validation Errors:", JSON.stringify(errors, null, 2));
  } else {
    console.log("Validation Passed!");
  }
}

test();
