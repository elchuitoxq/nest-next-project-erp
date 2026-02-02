import { Text, View, Page, Document } from "@react-pdf/renderer";
import { pdfStyles } from "./pdf-styles";
import { ReactNode } from "react";

interface DocumentLayoutProps {
  children: ReactNode;
  companyConfig?: {
    name: string;
    address: string;
    taxId: string;
    phone: string;
  };
}

const DEFAULT_COMPANY = {
  name: "MI EMPRESA C.A.",
  address:
    "Av. Principal, Edificio Central, Piso 1, Ofic. 101.\nCaracas, Venezuela",
  taxId: "J-12345678-9",
  phone: "+58 212 555-5555",
};

export const DocumentLayout = ({
  children,
  companyConfig = DEFAULT_COMPANY,
}: DocumentLayoutProps) => {
  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        {/* Header */}
        <View style={pdfStyles.header}>
          <View>
            <Text style={pdfStyles.logo}>{companyConfig.name}</Text>
          </View>
          <View style={pdfStyles.companyDetails}>
            <Text>{companyConfig.taxId}</Text>
            <Text>{companyConfig.address}</Text>
            <Text>{companyConfig.phone}</Text>
          </View>
        </View>

        {/* Content */}
        {children}

        {/* Footer */}
        <View style={pdfStyles.footer}>
          <Text>
            Este documento fue generado automáticamente por el sistema ERP.
          </Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `${pageNumber} / ${totalPages}`
            }
            fixed
          />
        </View>
      </Page>
    </Document>
  );
};
