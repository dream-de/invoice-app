type Props = {
  onClick?: () => void;
};

export function SaveButton({ onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="rounded-full bg-lime-300 px-6 py-3 text-sm font-black text-black"
    >
      Speichern
    </button>
  );
}
