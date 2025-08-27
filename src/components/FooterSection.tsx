
// import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import {
  Footer,
  FooterBottom,
} from "@/components/ui/footer";
// import { ModeToggle } from "@/components/ui/mode-toggle";
import { Link } from "react-router-dom";

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
  return (
    <footer className={cn("bg-background w-full px-4", className)}>
      <div className="max-w-container mx-auto">
        <Footer>
          <FooterBottom>
            <div>© Copyright 2019 MORECARE SYSTEMS, INC. All rights reserved</div>
            <div className="flex items-center gap-1">
              For more information feel free to 
              <Link to="/contact">Contact us</Link>
              {/* {showModeToggle && <ModeToggle />} */}
            </div>
          </FooterBottom>
        </Footer>
      </div>
    </footer>
  );
}
