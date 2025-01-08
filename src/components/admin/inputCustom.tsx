import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type inputCustomProps = {
  disable: boolean;
  name?: string;
  label: string;
  id: string;
  type?: string;
  placeholder?: string;
  value?: string | number;
  onChange?: (val: string | number) => void;
};

export default function InputCustom({
  disable,
  name,
  label,
  id,
  type,
  placeholder,
  value,
  onChange,
}: inputCustomProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!disable) {
      const newValue = type === "number" ? Number(e.target.value) : e.target.value;
      onChange?.(newValue); // Met à jour l'état parent
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
        value={value} // Utilise la valeur contrôlée
        onChange={handleChange}
      />
    </div>
  );
}