import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";

type inputCustomProps = {
  disable: boolean;
  name?: string;
  label: string;
  id: string;
  type: string;
  placeholder?: string;
  defaultValue?: string | number;
  onChange?: (val: string | number) => void;
};

export default function InputCustom({
  disable,
  name,
  label,
  id,
  type,
  placeholder,
  defaultValue,
  onChange,
}: inputCustomProps) {
  const [inputValue, setInputValue] = useState(defaultValue || ""); // Initialise avec defaultValue

  // Met à jour l'état si defaultValue change
  useEffect(() => {
    setInputValue(defaultValue || "");
  }, [defaultValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!disable) {
      const value = type === "number" ? Number(e.target.value) : e.target.value; // Convertir en nombre si nécessaire
      setInputValue(value); // Met à jour l'état local
      onChange?.(value); // Appeler la fonction onChange si elle est définie
    }
  };

  return (
    <div className="flex flex-col space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        name={name}
        readOnly={disable}
        id={id}
        type={type}
        placeholder={placeholder}
        value={inputValue}
        onChange={handleChange}
      />
    </div>
  );
}
