import { defineRailway, project, service } from "railway/iac";
// This repository manages only its own resources in the environment. Other
// repositories export their own partial name.
// See https://docs.railway.com/infrastructure-as-code#multi-repo-projects
export const partial = "kakeyo";
export default defineRailway(() => {
  const app = service("app", {
    // builder from CaC: "RAILPACK"
    build: "pnpm build",
    start: "pnpm start -p $PORT",
  });

  return project("kakeyo", {
    variables: { managed: false },
    resources: [app],
  });
});
