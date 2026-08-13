export default function WidgetLayout({ children }) {
  return (
    <div className="w-[300px] h-[250px] overflow-hidden m-0 p-0 bg-transparent">
      {children}
    </div>
  );
}
