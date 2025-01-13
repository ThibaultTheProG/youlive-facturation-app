import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function TableauFactures() {
  return (
    <>
      <Table>
        <TableCaption>Tableau des dernières factures.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Type de facture</TableHead>
            <TableHead>Honoraire Youlive HT</TableHead>
            <TableHead>Rétrocession HT</TableHead>
            <TableHead className="text-right">N° de mandat</TableHead>
            <TableHead className="text-right">Date de signature</TableHead>
            <TableHead className="text-right">Statut</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="font-medium"></TableCell>
            <TableCell></TableCell>
            <TableCell></TableCell>
            <TableCell className="text-right"></TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </>
  );
}
