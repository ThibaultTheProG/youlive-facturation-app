import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type inputCustomProps = {
  disable: boolean;
  label: string;
  id: string;
  type: string;
  placeholder: string;
}

export default function InputCustom({disable, label, id, type, placeholder}: inputCustomProps) {
  return (
    <div className="flex flex-col space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input disabled={disable} id={id} type={type} placeholder={placeholder} />
    </div>
  );
}
