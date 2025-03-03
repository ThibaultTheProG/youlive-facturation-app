import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { SelectItem } from "@/lib/types";

interface PopoverCustomProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  options: SelectItem[];
  value: string;
  onSelect: (value: string) => void;
  placeholder: string;
  searchPlaceholder: string;
  emptyMessage: string;
  selectedId?: number | null;
}

export default function PopoverCustom({
  open,
  onOpenChange,
  options,
  value,
  onSelect,
  placeholder,
  searchPlaceholder,
  emptyMessage,
  selectedId,
}: PopoverCustomProps) {
  const safeOptions = Array.isArray(options) ? options : [];

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[300px] justify-between"
        >
          {value || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 bg-white">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {safeOptions.map((option) => (
                <CommandItem
                  key={option.key}
                  value={option.name}
                  onSelect={(currentValue) => {
                    onSelect(currentValue);
                    onOpenChange(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedId === option.key ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
