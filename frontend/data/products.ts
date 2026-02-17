import { Product } from "@/types/product";

export type ProductCategory = "vials" | "bac-water";

export interface ProductWithCategory extends Product {
  category: ProductCategory;
  description: string;
  molecularFormula?: string;
  sequence?: string;
}

export const categories: { value: ProductCategory; label: string }[] = [
  { value: "vials", label: "Research Peptides" },
  { value: "bac-water", label: "Bacteriostatic Water" },
];

export const products: ProductWithCategory[] = [
  {
    id: "bpc-157",
    name: "BPC-157",
    chemicalName: "Body Protection Compound",
    casNumber: "137525-51-0",
    purity: "99%+ HPLC",
    price: 55.0,
    image: "/images/peptihub-product.png",
    images: [
      "/images/peptihub-product.png",
      "/images/product-vial.png",
      "/images/peptihub-logo.png",
    ],
    category: "vials",
    description: "A pentadecapeptide composed of 15 amino acids, derived from human gastric juice. BPC-157 has been extensively studied in research settings for its remarkable stability in human gastric juice, a property not shared by other peptides. Lyophilized, 5mg per vial. Third-party tested for purity and identity.",
    molecularFormula: "C₆₂H₉₈N₁₆O₂₂",
    sequence: "Gly-Glu-Pro-Pro-Pro-Gly-Lys-Pro-Ala-Asp-Asp-Ala-Gly-Leu-Val",
  },
  {
    id: "ghk-cu",
    name: "GHK-Cu",
    chemicalName: "Copper Peptide",
    casNumber: "49557-75-7",
    purity: "99%+ HPLC",
    price: 62.0,
    image: "/images/peptihub-product.png",
    category: "vials",
    description: "A naturally occurring copper complex of the tripeptide glycyl-L-histidyl-L-lysine. GHK-Cu is one of the most studied peptides in skin and tissue research, with over 100 published studies. Lyophilized, 50mg per vial. Third-party tested for purity and identity.",
    molecularFormula: "C₁₄H₂₄CuN₆O₄",
    sequence: "Gly-His-Lys·Cu²⁺",
  },
  {
    id: "tb-500",
    name: "TB-500",
    chemicalName: "Thymosin Beta-4",
    casNumber: "77591-33-4",
    purity: "99%+ HPLC",
    price: 58.0,
    image: "/images/peptihub-product.png",
    category: "vials",
    description: "A 43-amino acid peptide fragment of Thymosin Beta-4, a naturally occurring protein found in virtually all human and animal cells. TB-500 has been widely researched for its role in cell migration and differentiation. Lyophilized, 5mg per vial. Third-party tested for purity and identity.",
    molecularFormula: "C₂₁₂H₃₅₀N₅₆O₇₈S",
    sequence: "Ac-Ser-Asp-Lys-Pro-Asp-Met-Ala-Glu-Ile-Glu-Lys-Phe-Asp-Lys-Ser-Lys-Leu-Lys-Lys-Thr-Glu-Thr-Gln-Glu-Lys-Asn-Pro-Leu-Pro-Ser-Lys-Glu-Thr-Ile-Glu-Gln-Glu-Lys-Gln-Ala-Gly-Glu-Ser",
  },
  {
    id: "ipamorelin",
    name: "Ipamorelin",
    chemicalName: "Growth Hormone Secretagogue",
    casNumber: "170851-70-4",
    purity: "99%+ HPLC",
    price: 49.0,
    image: "/images/peptihub-product.png",
    category: "vials",
    description: "A selective growth hormone secretagogue pentapeptide composed of five amino acids. Ipamorelin is distinguished in research for its highly selective nature, making it one of the most studied GH secretagogues. Lyophilized, 5mg per vial. Third-party tested for purity and identity.",
    molecularFormula: "C₃₈H₄₉N₉O₅",
    sequence: "Aib-His-D-2-Nal-D-Phe-Lys-NH₂",
  },
  {
    id: "cjc-1295",
    name: "CJC-1295",
    chemicalName: "Modified GRF (1-29)",
    casNumber: "863288-34-0",
    purity: "99%+ HPLC",
    price: 64.0,
    image: "/images/peptihub-product.png",
    category: "vials",
    description: "A synthetic analogue of growth hormone-releasing hormone (GHRH) consisting of the first 29 amino acids of GHRH with modifications to extend its half-life. CJC-1295 is widely used in research on GH axis modulation. Lyophilized, 5mg per vial. Third-party tested for purity and identity.",
    molecularFormula: "C₁₅₂H₂₅₂N₄₄O₄₂",
    sequence: "Tyr-D-Ala-Asp-Ala-Ile-Phe-Thr-Gln-Ser-Tyr-Arg-Lys-Val-Leu-Ala-Gln-Leu-Ser-Ala-Arg-Lys-Leu-Leu-Gln-Asp-Ile-Leu-Ser-Arg-NH₂",
  },
  {
    id: "selank",
    name: "Selank",
    chemicalName: "TP-7 Heptapeptide",
    casNumber: "129954-34-3",
    purity: "99%+ HPLC",
    price: 45.0,
    image: "/images/peptihub-product.png",
    category: "vials",
    description: "A synthetic analogue of tuftsin, a naturally occurring immunomodulatory heptapeptide. Selank has been studied in over 100 published research papers for its effects on anxiety-related signaling pathways. Lyophilized, 5mg per vial. Third-party tested for purity and identity.",
    molecularFormula: "C₃₃H₅₇N₁₁O₉",
    sequence: "Thr-Lys-Pro-Arg-Pro-Gly-Pro",
  },
  {
    id: "thymosin-alpha-1",
    name: "Thymosin Alpha-1",
    chemicalName: "Tα1 Immunopeptide",
    casNumber: "62304-98-7",
    purity: "99%+ HPLC",
    price: 72.0,
    image: "/images/peptihub-product.png",
    category: "vials",
    description: "A 28-amino acid peptide originally isolated from the thymus gland. Thymosin Alpha-1 has been the subject of extensive immunological research and is one of the most well-characterized thymic peptides. Lyophilized, 5mg per vial. Third-party tested for purity and identity.",
    molecularFormula: "C₁₂₉H₂₁₅N₃₃O₅₅",
    sequence: "Ac-Ser-Asp-Ala-Ala-Val-Asp-Thr-Ser-Ser-Glu-Ile-Thr-Thr-Lys-Asp-Leu-Lys-Glu-Lys-Lys-Glu-Val-Val-Glu-Glu-Ala-Glu-Asn",
  },
  {
    id: "ll-37",
    name: "LL-37",
    chemicalName: "Cathelicidin Antimicrobial",
    casNumber: "154947-66-7",
    purity: "98%+ HPLC",
    price: 68.0,
    image: "/images/peptihub-product.png",
    category: "vials",
    description: "A 37-amino acid human cathelicidin antimicrobial peptide. LL-37 is the only member of the cathelicidin family found in humans and has been extensively studied for its role in innate immune defense research. Lyophilized, 5mg per vial. Third-party tested for purity and identity.",
    molecularFormula: "C₂₀₅H₃₄₀N₆₀O₅₃",
    sequence: "Leu-Leu-Gly-Asp-Phe-Phe-Arg-Lys-Ser-Lys-Glu-Lys-Ile-Gly-Lys-Glu-Phe-Lys-Arg-Ile-Val-Gln-Arg-Ile-Lys-Asp-Phe-Leu-Arg-Asn-Leu-Val-Pro-Arg-Thr-Glu-Ser",
  },
];

// Bundle definitions
export interface Bundle {
  id: string;
  name: string;
  description: string;
  productIds: string[];
  discountPercent: number;
}

export const bundles: Bundle[] = [
  {
    id: "recovery-stack",
    name: "Recovery Stack",
    description: "BPC-157 and TB-500 paired together for comprehensive research protocols.",
    productIds: ["bpc-157", "tb-500"],
    discountPercent: 12,
  },
  {
    id: "growth-stack",
    name: "Growth Stack",
    description: "CJC-1295 and Ipamorelin paired together for synergistic research protocols.",
    productIds: ["cjc-1295", "ipamorelin"],
    discountPercent: 10,
  },
  {
    id: "immune-defense",
    name: "Immune Defense Stack",
    description: "Thymosin Alpha-1 and LL-37 paired together for research applications.",
    productIds: ["thymosin-alpha-1", "ll-37"],
    discountPercent: 10,
  },
  {
    id: "complete-research",
    name: "Complete Research Kit",
    description: "All 8 peptides in one kit — the broadest research toolkit at the best value.",
    productIds: ["bpc-157", "tb-500", "ghk-cu", "ipamorelin", "cjc-1295", "selank", "thymosin-alpha-1", "ll-37"],
    discountPercent: 18,
  },
];
