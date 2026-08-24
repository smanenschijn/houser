export function statusBadgeClass(status: string | null): string | null {
  switch (status) {
    case "onder bod":
    case "verkocht onder voorbehoud":
      return "bg-sun-100 text-[#8a6d1a]";
    case "verkocht":
      return "bg-neutral-100 text-neutral-600";
    default:
      return null;
  }
}
