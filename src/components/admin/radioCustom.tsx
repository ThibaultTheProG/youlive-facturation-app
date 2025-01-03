import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type RadioCustomProps = {
  value?: string;
  onChange?: (val: string) => void;
  defaultValue?: boolean;
};

export default function RadioCustom({ value, onChange, defaultValue }: RadioCustomProps) {

  let valeurParDefaut = "";

  if (defaultValue) {
    valeurParDefaut = "Oui";
  } else if (defaultValue === false) {
    valeurParDefaut = "Non"
  } else {
    valeurParDefaut = "Non renseigné"
  }

  return (
    <RadioGroup defaultValue={valeurParDefaut} value={value} onValueChange={(val) => onChange?.(val)}>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="Oui" id="r2" />
        <Label htmlFor="r2">Oui</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="Non" id="r3" />
        <Label htmlFor="r3">Non</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="Non renseigné" id="r3" />
        <Label htmlFor="r3">Non renseigné</Label>
      </div>
    </RadioGroup>
  );
}
