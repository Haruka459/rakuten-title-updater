// 汎用カード枠。角丸・薄い枠線でコンテンツをグルーピングする。

type CardProps = {
  title?: string;
  description?: string;
  children: React.ReactNode;
};

export default function Card({ title, description, children }: CardProps) {
  return (
    <section className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/5 p-4 sm:p-5">
      {(title || description) && (
        <header className="mb-3">
          {title && (
            <h2 className="text-base font-semibold text-[#0b0b0b] dark:text-white">{title}</h2>
          )}
          {description && (
            <p className="text-sm text-[#52514e] dark:text-[#c3c2b7] mt-0.5">{description}</p>
          )}
        </header>
      )}
      {children}
    </section>
  );
}
