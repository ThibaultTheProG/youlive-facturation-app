import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SelectItemType = string | { key: number; name: string };

interface SelectCustomProps {
  placeholder: string;
  selectLabel: string;
  options: SelectItemType[]; // Tableau contenant soit des chaînes, soit des objets
  value: string; // La valeur sélectionnée
  onChange: (val: string) => void; // Callback pour gérer le changement
  name?: string; // Nom du champ
}

export default function SelectCustom({
  placeholder,
  selectLabel,
  options,
  value,
  onChange,
  name,
}: SelectCustomProps) {
  return (
    <Select
      value={value}
      onValueChange={(val) => onChange(val)} // Informe le parent de la nouvelle valeur
      name={name}
    >
      <SelectTrigger className="w-[180px] rounded-md">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="bg-white">
        <SelectGroup>
          <SelectLabel>{selectLabel}</SelectLabel>
          {options.map((item, index) =>
            typeof item === "string" ? (
              <SelectItem key={index} value={item}>
                {item}
              </SelectItem>
            ) : (
              <SelectItem key={item.key} value={item.name}>
                {item.name}
              </SelectItem>
            )
          )}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
