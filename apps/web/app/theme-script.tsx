import { cookies } from "next/headers";

export default async function ThemeScript() {
  const cookieStore = await cookies();
  const bgColor = cookieStore.get("novel__background-color")?.value || "white";

  // 根据颜色选择确定CSS变量值（使用HSL格式）
  let bgValue = "hsl(0, 0%, 100%)"; // white
  switch (bgColor) {
    case "white":
      bgValue = "hsl(0, 0%, 100%)";
      break;
    case "beige":
      bgValue = "hsl(50, 100%, 96%)";
      break;
    case "green":
      bgValue = "hsl(140, 82%, 96%)";
      break;
    case "blue":
      bgValue = "hsl(213, 100%, 96%)";
      break;
    case "dark":
      bgValue = "hsl(222.2 84% 4.9%)";
      break;
    default:
      bgValue = "hsl(0, 0%, 100%)";
  }

  return (
    <style>
      {`:root {
        --novel-bg-color: ${bgValue};
      }`}
    </style>
  );
}
