/** Drew Miller’s sales team — under his umbrella at Ray White Mairangi Bay. */
export const TEAM_MEMBER_IDS = [
  135477, // Drew Miller
  149412, // Dane Smuts
  140242, // Paige Field
  188066, // Pavithra Pillay
  188410, // Vernon Rodrigues
  177558, // Harrison Cutfield
] as const;

export const TEAM_SEED = [
  {
    slug: "drew-miller",
    name: "Drew Miller",
    role: "Elite Agent · Team Lead",
    email: "drew.miller@raywhite.com",
    phone: "021 963 654",
    photoUrl:
      "https://cdn6.ep.dynamics.net/s3/rw-media/memberphotos/53091d04-b4fb-44b8-a4cf-08cc2c496475.jpg",
    sourceUrl: "https://rwmairangibay.co.nz/agents/drew-miller/135477",
    rwMemberId: 135477,
    rwUsername: "dm211313241",
    isLead: true,
    sortOrder: 0,
  },
  {
    slug: "paige-field",
    name: "Paige Field",
    role: "Licensee Salesperson",
    email: "paige.field@raywhite.com",
    phone: "027 587 5112",
    photoUrl:
      "https://cdn6.ep.dynamics.net/s3/rw-media/memberphotos/9641b93d-3242-4efd-9df2-c586828e2324.jpg",
    sourceUrl: "https://rwmairangibay.co.nz/agents/paige-field/140242",
    rwMemberId: 140242,
    rwUsername: "pf220910044",
    isLead: false,
    sortOrder: 1,
  },
  {
    slug: "dane-smuts",
    name: "Dane Smuts",
    role: "Licensee Salesperson",
    email: "dane.smuts@raywhite.com",
    phone: "021 0250 9537",
    photoUrl:
      "https://cdn6.ep.dynamics.net/s3/rw-media/memberphotos/47b5755d-922b-46c0-8aa2-f3eecf2fd315.png",
    sourceUrl: "https://rwmairangibay.co.nz/agents/dane-smuts/149412",
    rwMemberId: 149412,
    rwUsername: "ds221722076",
    isLead: false,
    sortOrder: 2,
  },
  {
    slug: "pavithra-pillay",
    name: "Pavithra Pillay",
    role: "Licensee Salesperson",
    email: "pavithra.pillay@raywhite.com",
    phone: "021 420 995",
    photoUrl:
      "https://cdn6.ep.dynamics.net/s3/rw-media/memberphotos/653b26ee-8d6c-4443-8f41-56f36c8a9e4a.jpg",
    sourceUrl: "https://rwmairangibay.co.nz/agents/pavithra-pillay/188066",
    rwMemberId: 188066,
    rwUsername: "pp2606030900",
    isLead: false,
    sortOrder: 3,
  },
  {
    slug: "vernon-rodrigues",
    name: "Vernon Rodrigues",
    role: "Licensee Salesperson",
    email: "vernon.rodrigues@raywhite.com",
    phone: "027 512 4711",
    photoUrl:
      "https://cdn6.ep.dynamics.net/s3/rw-media/memberphotos/8d664d2f-1a54-4ca0-bf21-341531fbd938.jpg",
    sourceUrl: "https://rwmairangibay.co.nz/agents/vernon-rodrigues/188410",
    rwMemberId: 188410,
    rwUsername: "vr2606142231",
    isLead: false,
    sortOrder: 4,
  },
  {
    slug: "harrison-cutfield",
    name: "Harrison Cutfield",
    role: "Licensee Salesperson",
    email: "harrison.cutfield@raywhite.com",
    phone: "021 136 1955",
    photoUrl:
      "https://cdn6.ep.dynamics.net/s3/rw-media/memberphotos/893f14e4-23c4-495c-a308-30d9eb0d32ed.png",
    sourceUrl: "https://rwmairangibay.co.nz/agents/harrison-cutfield/177558",
    rwMemberId: 177558,
    rwUsername: "hc250407314",
    isLead: false,
    sortOrder: 5,
  },
] as const;

export type AgentThumb = {
  slug: string;
  name: string;
  photoUrl?: string | null;
};
