import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";

type SelectItemType = {
  key: number;
  name: string;
};

interface SelectCustomProps {
  placeholder: string;
  selectLabel: string;
  value?: SelectItemType[] | string[];
  defaultValue?: string;
  onChange?: (val: string) => void;
  name?: string;
}

export default function SelectCustom({
  placeholder,
  selectLabel,
  value,
  defaultValue,
  onChange,
  name
}: SelectCustomProps) {
  const [valeurParDefaut, setValeurParDefaut] = useState("");

  useEffect(() => {
    if (defaultValue === "Offre Youlive" || defaultValue === "Offre Découverte") {
      setValeurParDefaut(defaultValue);
    } else {
      setValeurParDefaut("Non renseigné");
    }
  }, [defaultValue]);


  const renderSelectItems = () => {
    if (Array.isArray(value)) {
      return value.map((item) => {
        if (typeof item !== "string") {
          return (
            <SelectItem key={item.key} value={item.name}>
              {item.name}
            </SelectItem>
          );
        } else {
          return (
            <SelectItem key="Erreur" value="Erreur">
              Erreur
            </SelectItem>
          );
        }
      });
    } else {
      return (
        <>
          <SelectItem key="Offre Youlive" value="Offre Youlive">
            Offre Youlive
          </SelectItem>
          <SelectItem key="Offre Découverte" value="Offre Découverte">
            Offre Découverte
          </SelectItem>
        </>
      );
    }
  };

  return (
    <Select
      value={valeurParDefaut}
      onValueChange={(val) => {
        setValeurParDefaut(val);
        onChange?.(val);
      }}
      name={name}
    >
      <SelectTrigger className="w-[180px] rounded-md">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="bg-white">
        <SelectGroup>
          <SelectLabel>{selectLabel}</SelectLabel>
          {renderSelectItems()}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}