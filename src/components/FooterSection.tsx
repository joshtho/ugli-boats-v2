
// import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import {
  Footer,
  FooterBottom,
} from "@/components/ui/footer";
// import { ModeToggle } from "@/components/ui/mode-toggle";
import { Link } from "react-router-dom";
import { ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FooterLink {
  text: string;
  href: string;
}

interface FooterColumnProps {
  title: string;
  links: FooterLink[];
}

interface FooterProps {
  
  name?: string;
  columns?: FooterColumnProps[];
  copyright?: string;
  policies?: FooterLink[];
  showModeToggle?: boolean;
  className?: string;
}

export default function FooterSection({
//   showModeToggle = true,
  className,
}: FooterProps) {
  
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <footer className={cn("bg-background w-full px-4", className)}>
      <div className="max-w-container mx-auto">
        <Footer>
              <Button
                variant="outline"
                size="sm"
                onClick={scrollToTop}
                className="flex place-self-center gap-1 hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <ChevronUp className="h-4 w-4" />
                Back to Top
              </Button>
          <FooterBottom>
            <div>© Copyright UgliBoats.com All rights reserved</div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                For more information feel free to 
                <Link className="text-primary" to="/contact">Contact us</Link>
              </div>
              {/* {showModeToggle && <ModeToggle />} */}
            </div>
          </FooterBottom>
        </Footer>
      </div>
    </footer>
  );
}
