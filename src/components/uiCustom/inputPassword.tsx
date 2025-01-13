import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type inputPasswordProps = {
  name?: string;
  label: string;
  id: string;
  type?: string;
  value?: string;
  onChange?: (val: string) => void;
};

export default function InputPassword({
  name,
  label,
  id,
  type,
  value,
  onChange,
}: inputPasswordProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange?.(newValue); // Met à jour l'état parent
  };
  return (
    <div className="flex flex-col space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        name={name}
        id={id}
        type={type}
        value={value} // Utilise la valeur contrôlée
        onChange={handleChange}
      />
    </div>
  );
}
