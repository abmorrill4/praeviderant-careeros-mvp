# Implementation Patterns Guide

## Overview

This guide documents the key implementation patterns, architectural decisions, and development practices used throughout CareerOS. It serves as a blueprint for maintaining consistency and best practices during development and strategic pivots.

## 🏗️ React Component Architecture

### Component Organization Patterns

**Layered Component Structure:**
```
src/components/
├── ui/                    # Base UI primitives (shadcn/ui)
├── shared/                # Cross-feature reusable components  
├── [feature]/             # Feature-specific components
│   ├── [FeatureName].tsx  # Main feature component
│   ├── sub-components/    # Feature sub-components
│   └── types.ts          # Feature-specific types
└── layouts/              # Layout components
```

**Component Design Principles:**

1. **Single Responsibility**: Each component has one clear purpose
2. **Composition over Inheritance**: Use composition patterns extensively
3. **Prop Drilling Avoidance**: Use contexts for deep prop passing
4. **Type Safety**: Full TypeScript coverage with strict typing

**Example Implementation Pattern:**
```typescript
// Feature component pattern
interface ProfileSectionProps {
  data: ProfileData;
  onUpdate: (data: Partial<ProfileData>) => void;
  isEditing?: boolean;
  className?: string;
}

const ProfileSection: React.FC<ProfileSectionProps> = ({ 
  data, 
  onUpdate, 
  isEditing = false,
  className 
}) => {
  const { user } = useAuthOptimized();
  const { mutate: updateProfile } = useProfileUpdate();
  
  // Component logic here
  
  return (
    <div className={cn("profile-section", className)}>
      {/* Component JSX */}
    </div>
  );
};
```

### Conditional Rendering Patterns

**Safe Conditional Rendering:**
```typescript
// Preferred pattern - explicit null checks
const ConditionalComponent = ({ data }: { data?: DataType }) => {
  if (!data) {
    return <LoadingSpinner />;
  }
  
  return <DataDisplay data={data} />;
};

// Array rendering with safe defaults
const ListComponent = ({ items = [] }: { items?: Item[] }) => (
  <div>
    {items.length > 0 ? (
      items.map(item => <ItemCard key={item.id} item={item} />)
    ) : (
      <EmptyState message="No items found" />
    )}
  </div>
);
```

## 🪝 Custom Hooks Architecture

### Hook Design Patterns

**Data Fetching Hook Pattern:**
```typescript
interface UseDataFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

function useDataFetch<T>(
  endpoint: string,
  options?: FetchOptions
): UseDataFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiCall<T>(endpoint, options);
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [endpoint, options]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  return { data, loading, error, refetch: fetchData };
}
```

**Optimized Authentication Hook:**
```typescript
// Centralized auth logic with performance optimization
export const useAuthOptimized = () => {
  const supabase = useSupabaseClient();
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: ['auth-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};
```

### State Management Patterns

**Local State with useReducer:**
```typescript
interface FormState {
  values: Record<string, any>;
  errors: Record<string, string>;
  isSubmitting: boolean;
}

const formReducer = (state: FormState, action: FormAction): FormState => {
  switch (action.type) {
    case 'SET_FIELD':
      return {
        ...state,
        values: { ...state.values, [action.field]: action.value },
        errors: { ...state.errors, [action.field]: undefined }
      };
    case 'SET_ERROR':
      return {
        ...state,
        errors: { ...state.errors, [action.field]: action.error }
      };
    case 'SET_SUBMITTING':
      return { ...state, isSubmitting: action.isSubmitting };
    default:
      return state;
  }
};
```

## 🎨 Design System Implementation

### Semantic Token Usage

**Color System Pattern:**
```css
/* index.css - Semantic color tokens */
:root {
  /* Primary palette */
  --career-accent: 266 83% 58%;
  --career-accent-light: 266 83% 68%;
  --career-accent-dark: 266 83% 48%;
  
  /* Status colors */
  --status-success: 142 77% 53%;
  --status-warning: 47 96% 53%;
  --status-error: 0 84% 60%;
  
  /* Neutral palette */
  --neutral-50: 210 40% 98%;
  --neutral-900: 222.2 84% 4.9%;
}
```

**Component Styling Pattern:**
```typescript
// Using semantic tokens in components
const Button = ({ variant = 'default', ...props }: ButtonProps) => (
  <button 
    className={cn(
      "px-4 py-2 rounded-lg font-medium transition-all",
      {
        'bg-career-accent text-white hover:bg-career-accent-light': variant === 'primary',
        'bg-neutral-100 text-neutral-900 hover:bg-neutral-200': variant === 'secondary'
      }
    )}
    {...props}
  />
);
```

### Component Variant System

**Variant Configuration Pattern:**
```typescript
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md font-medium transition-all",
  {
    variants: {
      variant: {
        default: "bg-career-accent text-white hover:bg-career-accent-light",
        outline: "border border-career-accent text-career-accent hover:bg-career-accent hover:text-white",
        ghost: "hover:bg-neutral-100 text-career-accent"
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4",
        lg: "h-12 px-6 text-lg"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "md"
    }
  }
);
```

## 🔄 Data Flow Patterns

### API Integration Patterns

**Supabase Edge Function Pattern:**
```typescript
// Client-side API call pattern
const useAPICall = <T>(functionName: string) => {
  return useMutation({
    mutationFn: async (data: any) => {
      const { data: result, error } = await supabase.functions.invoke(functionName, {
        body: data
      });
      
      if (error) throw error;
      return result as T;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['related-data']);
    }
  });
};
```

**Error Handling Pattern:**
```typescript
// Centralized error handling
const withErrorHandling = async <T>(
  operation: () => Promise<T>,
  context: string = 'operation'
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    console.error(`Error in ${context}:`, error);
    
    if (error instanceof AuthError) {
      // Handle auth errors
      throw new Error('Authentication required');
    }
    
    if (error instanceof ValidationError) {
      // Handle validation errors
      throw error;
    }
    
    // Generic error handling
    throw new Error(`${context} failed`);
  }
};
```

### Real-time Data Patterns

**Supabase Real-time Integration:**
```typescript
const useRealtimeData = <T>(
  table: string, 
  filter?: string
) => {
  const [data, setData] = useState<T[]>([]);
  
  useEffect(() => {
    const channel = supabase
      .channel(`realtime-${table}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: table,
        filter: filter
      }, (payload) => {
        setData(current => {
          switch (payload.eventType) {
            case 'INSERT':
              return [...current, payload.new as T];
            case 'UPDATE':
              return current.map(item => 
                item.id === payload.new.id ? payload.new as T : item
              );
            case 'DELETE':
              return current.filter(item => item.id !== payload.old.id);
            default:
              return current;
          }
        });
      })
      .subscribe();
      
    return () => supabase.removeChannel(channel);
  }, [table, filter]);
  
  return data;
};
```

## 🔧 Form Management Patterns

### React Hook Form Integration

**Form Component Pattern:**
```typescript
interface FormData {
  name: string;
  email: string;
  experience: WorkExperience[];
}

const ProfileForm: React.FC = () => {
  const { control, handleSubmit, formState } = useForm<FormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      email: '',
      experience: []
    }
  });
  
  const { mutate: updateProfile } = useProfileUpdate();
  
  const onSubmit = (data: FormData) => {
    updateProfile(data);
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Controller
        name="name"
        control={control}
        render={({ field, fieldState }) => (
          <FormField
            {...field}
            label="Name"
            error={fieldState.error?.message}
          />
        )}
      />
      {/* More fields */}
    </form>
  );
};
```

### Validation Patterns

**Zod Schema Pattern:**
```typescript
import { z } from 'zod';

const workExperienceSchema = z.object({
  company: z.string().min(1, 'Company is required'),
  title: z.string().min(1, 'Title is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
  description: z.string().optional(),
});

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  experience: z.array(workExperienceSchema)
});
```

## 🔍 Error Boundary Patterns

### Component Error Boundaries

**Error Boundary Implementation:**
```typescript
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<
  PropsWithChildren<{}>, 
  ErrorBoundaryState
> {
  constructor(props: PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Log to monitoring service
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    
    return this.props.children;
  }
}
```

## 📱 Responsive Design Patterns

### Mobile-First Approach

**Responsive Component Pattern:**
```typescript
const ResponsiveLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  return (
    <div className={cn(
      "container mx-auto px-4",
      {
        "max-w-full": isMobile,
        "max-w-6xl": !isMobile
      }
    )}>
      {children}
    </div>
  );
};
```

**Breakpoint Management:**
```css
/* tailwind.config.ts */
module.exports = {
  theme: {
    screens: {
      'sm': '640px',
      'md': '768px', 
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    }
  }
}
```

## 🧪 Testing Patterns

### Component Testing Strategy

**Testing Pattern:**
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });
  
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('ProfileSection', () => {
  it('renders profile data correctly', () => {
    const mockData = { name: 'John Doe', email: 'john@example.com' };
    
    renderWithProviders(
      <ProfileSection data={mockData} onUpdate={jest.fn()} />
    );
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });
});
```

## 🚀 Performance Optimization Patterns

### Code Splitting

**Route-based Code Splitting:**
```typescript
import { lazy, Suspense } from 'react';

const ProfilePage = lazy(() => import('../pages/ProfilePage'));
const InterviewPage = lazy(() => import('../pages/InterviewPage'));

const AppRoutes = () => (
  <Routes>
    <Route 
      path="/profile" 
      element={
        <Suspense fallback={<LoadingSpinner />}>
          <ProfilePage />
        </Suspense>
      } 
    />
  </Routes>
);
```

### Memoization Patterns

**React.memo Usage:**
```typescript
const ExpensiveComponent = React.memo<Props>(({ data, onUpdate }) => {
  const processedData = useMemo(() => 
    processComplexData(data), [data]
  );
  
  const handleUpdate = useCallback((id: string, value: any) => {
    onUpdate(id, value);
  }, [onUpdate]);
  
  return <ComplexVisualization data={processedData} onUpdate={handleUpdate} />;
});
```

## 📋 Development Guidelines

### Code Quality Standards

1. **TypeScript**: Strict typing with no `any` types
2. **ESLint**: Consistent code formatting and best practices
3. **Component Size**: Maximum 200 lines per component
4. **Function Complexity**: Maximum 10 cyclomatic complexity
5. **Props**: Maximum 8 props per component

### Performance Guidelines

1. **Bundle Size**: Keep chunks under 250KB
2. **Render Performance**: < 16ms per render cycle
3. **Memory Usage**: Monitor for memory leaks
4. **Network**: Minimize API calls with caching

### Accessibility Standards

1. **WCAG 2.1 AA**: Minimum compliance level
2. **Keyboard Navigation**: Full keyboard accessibility
3. **Screen Readers**: Proper ARIA labels
4. **Color Contrast**: Minimum 4.5:1 ratio

---

**Document Status**: Implementation Patterns Guide v1.0
**Last Updated**: January 2025
**Dependencies**: TECHNICAL_FOUNDATION.md

This guide provides the complete implementation patterns and best practices used throughout CareerOS, essential for maintaining code quality and consistency during development and strategic pivots.