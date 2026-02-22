import { useSkillsStore } from '@/stores/skills-store';
import type { SkillMessage } from '@/types/skills';

export function useSkills() {
  const skills = useSkillsStore((s) => s.skills);
  const isLoading = useSkillsStore((s) => s.isLoading);
  const error = useSkillsStore((s) => s.error);
  const busyKey = useSkillsStore((s) => s.busyKey);
  return { skills, isLoading, error, busyKey };
}

export function useSkillActions() {
  const loadSkills = useSkillsStore((s) => s.loadSkills);
  const toggleSkill = useSkillsStore((s) => s.toggleSkill);
  const saveApiKey = useSkillsStore((s) => s.saveApiKey);
  const installSkill = useSkillsStore((s) => s.installSkill);
  const setApiKeyEdit = useSkillsStore((s) => s.setApiKeyEdit);
  return { loadSkills, toggleSkill, saveApiKey, installSkill, setApiKeyEdit };
}

export function useSkillMessage(skillKey: string): SkillMessage | null {
  return useSkillsStore((s) => s.messages[skillKey] ?? null);
}

export function useSkillApiKeyEdit(skillKey: string): string {
  return useSkillsStore((s) => s.apiKeyEdits[skillKey] ?? '');
}
