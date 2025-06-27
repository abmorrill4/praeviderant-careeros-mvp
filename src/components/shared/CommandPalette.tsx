
import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import {
  Command,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Briefcase, GraduationCap, Star, Plus } from 'lucide-react';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const quickAddActions = [
  {
    id: 'add-work-experience',
    label: 'Add New Work Experience',
    icon: Briefcase,
    action: 'add_work_experience',
  },
  {
    id: 'add-education',
    label: 'Add New Education',
    icon: GraduationCap,
    action: 'add_education',
  },
  {
    id: 'add-skill',
    label: 'Add New Skill',
    icon: Star,
    action: 'add_skill',
  },
  {
    id: 'start-interview',
    label: 'Start a New Interview',
    icon: Plus,
    action: 'start_interview',
  },
];

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  open,
  onOpenChange,
}) => {
  const { theme } = useTheme();

  const handleAction = (action: string, label: string) => {
    console.log(`Action triggered: ${action} - ${label}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`max-w-2xl p-0 ${theme === 'dark' ? 'bg-career-panel-dark border-career-gray-dark' : 'bg-career-panel-light border-career-gray-light'}`}>
        <Command className={`${theme === 'dark' ? 'bg-career-panel-dark' : 'bg-career-panel-light'}`}>
          <CommandInput
            placeholder="Search for actions..."
            className={`border-none ${theme === 'dark' ? 'text-career-text-dark placeholder:text-career-text-muted-dark' : 'text-career-text-light placeholder:text-career-text-muted-light'}`}
          />
          <CommandList>
            <CommandGroup 
              heading="Quick Add"
              className={`${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}
            >
              {quickAddActions.map((item) => {
                const Icon = item.icon;
                return (
                  <CommandItem
                    key={item.id}
                    onSelect={() => handleAction(item.action, item.label)}
                    className={`flex items-center gap-3 p-3 cursor-pointer ${
                      theme === 'dark'
                        ? 'text-career-text-dark hover:bg-career-gray-dark data-[selected=true]:bg-career-gray-dark'
                        : 'text-career-text-light hover:bg-career-gray-light data-[selected=true]:bg-career-gray-light'
                    }`}
                  >
                    <Icon className="w-5 h-5 text-career-accent" />
                    <span className="font-medium">{item.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
};
