import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/contexts/LanguageContext";
import { Languages } from "lucide-react";

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Switch language"
          className="rounded-lg"
        >
          <Languages className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px]">
        <DropdownMenuItem
          onClick={() => setLanguage("en")}
          className={`cursor-pointer gap-2 ${language === "en" ? "bg-accent font-semibold" : ""}`}
        >
          <span className="text-base">🇺🇸</span>
          <span>English</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setLanguage("km")}
          className={`cursor-pointer gap-2 ${language === "km" ? "bg-accent font-semibold" : ""}`}
        >
          <span className="text-base">🇰🇭</span>
          <span>ភាសាខ្មែរ</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
