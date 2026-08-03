import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { ALL_SKILLS } from "@/lib/skillsData";

const MAX_SUGGESTIONS = 8;

// Drop-in replacement for a plain comma-separated Skills <Input> — suggests
// matches from the master skills list (frontend/src/lib/skillsData.ts) as the
// user types the current (last) comma-separated fragment, so skill names stay
// consistent across gigs/profiles/jobs instead of everyone typing free text.
export function SkillsInput({
  id,
  value,
  onChange,
  placeholder,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const [focused, setFocused] = useState(false);

  const currentFragment = value.split(",").pop()?.trim() ?? "";
  const alreadyChosen = new Set(
    value
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  );

  const suggestions = useMemo(() => {
    if (!currentFragment) return [];
    const query = currentFragment.toLowerCase();
    return ALL_SKILLS.filter((skill) => skill.toLowerCase().includes(query) && !alreadyChosen.has(skill.toLowerCase())).slice(
      0,
      MAX_SUGGESTIONS
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFragment]);

  const applySuggestion = (skill: string) => {
    const parts = value.split(",");
    parts[parts.length - 1] = ` ${skill}`;
    onChange(parts.map((p) => p.trim()).join(", ") + ", ");
  };

  return (
    <div className="relative">
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
      />
      {focused && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-52 overflow-y-auto rounded-lg border border-border bg-popover py-1 shadow-card">
          {suggestions.map((skill) => (
            <button
              key={skill}
              type="button"
              // onMouseDown fires before the input's onBlur, so the click
              // registers before the dropdown would otherwise disappear.
              onMouseDown={(e) => {
                e.preventDefault();
                applySuggestion(skill);
              }}
              className="block w-full px-3 py-1.5 text-left text-sm hover:bg-accent"
            >
              {skill}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
