import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type RadioCustomProps = {
  value: string;
  onChange: (val: string) => void;
  name: string;
};

export default function RadioCustom({
  value,
  onChange,
  name,
}: RadioCustomProps) {
  return (
    <RadioGroup name={name} value={value} onValueChange={onChange}>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="oui" id={`${name}-oui`} />
        <Label htmlFor={`${name}-oui`}>Oui</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="non" id={`${name}-non`} />
        <Label htmlFor={`${name}-non`}>Non</Label>
      </div>
    </RadioGroup>
  );
}
