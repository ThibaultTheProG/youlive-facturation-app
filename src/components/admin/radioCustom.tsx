import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useState, useEffect } from "react";

type RadioCustomProps = {
  onChange?: (val: string) => void;
  defaultValue?: boolean;
  name?: string;
};

export default function RadioCustom({
  onChange,
  defaultValue,
  name,
}: RadioCustomProps) {
  const [valeurParDefaut, setValeurParDefaut] = useState("not-set");

  useEffect(() => {
    if (defaultValue === true) {
      setValeurParDefaut("oui");
    } else if (defaultValue === false) {
      setValeurParDefaut("non");
    } else {
      setValeurParDefaut("not-set");
    }
  }, [defaultValue]);

  return (
    <RadioGroup
      name={name}
      value={valeurParDefaut}
      onValueChange={(val) => {
        setValeurParDefaut(val);
        onChange?.(val);
      }}
    >
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="oui" id={`${name}-oui`} />
        <Label htmlFor={`${name}-oui`}>Oui</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="non" id={`${name}-non`} />
        <Label htmlFor={`${name}-non`}>Non</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="not-set" id={`${name}-not-set`} />
        <Label htmlFor={`${name}-not-set`}>Non renseigné</Label>
      </div>
    </RadioGroup>
  );
}
