import { createContext } from "react";

export interface LangProps {
  lang: "en" | "fr";
  data: any;
}

const LanguagesContext = createContext<{
  data: LangProps;
  change: ((lang: "en" | "fr") => void) | null;
} | null>({
  data: {
    lang: "en",
    data: null,
  },
  change: null,
});

export default LanguagesContext;
