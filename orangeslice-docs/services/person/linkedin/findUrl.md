/\*_ Credits: 2 standard, or 50 when `email` is provided. Charged only if a valid URL is returned. _/

/\*\*

- Find a LinkedIn profile URL
  _/
  type findUrl = (params: {
  /\*\* Full name _/
  name?: string;
  /** Job title \*/
  title?: string;
  /** Company name _/
  company?: string;
  /\*\* Additional keyword, industry, etc. Any more data to specify the person _/
  keyword?: string;
  /\*_ Location string (e.g., city, state, country) to narrow search results _/
  location?: string;
  /\*_ Email address. If provided, reverse-email lookup runs first, then falls back to search. _/
  email?: string;
  }) => Promise<string | undefined>;
