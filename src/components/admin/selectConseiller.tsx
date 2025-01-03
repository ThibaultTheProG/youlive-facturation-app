import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SelectItem = {
  key: number;
  name: string;
  typeContrat?: string[];
};

interface selectCustomProps {
  placeholder: string;
  selectLabel: string;
  value: SelectItem[] | string[];
  onChange: (val: string) => void;
}

export default function SelectCustom({
  placeholder,
  selectLabel,
  value,
  onChange,
}: selectCustomProps) {
  return (
    <Select onValueChange={(val) => onChange?.(val)}>
      <SelectTrigger className="w-[180px] rounded-md">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="bg-white">
        <SelectGroup>
          <SelectLabel>{selectLabel}</SelectLabel>
          {Array.isArray(value) &&
            value.map((item) =>
              typeof item === "string" ? (
                <SelectItem key={item} value={item}>
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
