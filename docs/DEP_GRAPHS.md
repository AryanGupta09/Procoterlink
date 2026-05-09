# Dependency Graphs (Key Subfolders)

This document provides Mermaid dependency graphs for all major features/routes, to visualize page-to-module and data dependencies at a glance. Keep updated as you evolve the codebase.


## app/student/dashboard/*
```mermaid
flowchart TD
  subgraph StudentDashboard[app/student/dashboard/*]
    S0[layout.tsx]
    S1[page.tsx]
    S2[submission/[id]/page.tsx]
  end

  subgraph UI[components/ui/*]
    U1[button]
    U2[card]
    U3[badge]
    U4[input]
  end

  subgraph LIB[lib/*]
    L1[firebase]
    L2[utils]
  end

  subgraph CORE
    C1[context/AuthContext]
    C2[hooks/use-toast]
  end

  S0 --> U2
  S1 --> L1
  S1 --> C1
  S1 --> U1
  S1 --> U2
  S1 --> U3
  S1 --> LIB
  S1 --> C2
  S2 --> L1
  S2 --> U2
  S2 --> U4
```


## app/dashboard/results/*
```mermaid
flowchart TD
  subgraph DashboardResults[app/dashboard/results/*]
    DR1[page.tsx]
  end

  subgraph UI
    U1[button]
    U2[card]
    U3[input]
    U4[select]
  end

  subgraph LIB
    L1[firebase]
    L2[utils]
  end

  subgraph CORE
    C1[context/AuthContext]
    C2[hooks/use-toast]
  end

  DR1 --> L1
  DR1 --> L2
  DR1 --> U1
  DR1 --> U2
  DR1 --> U3
  DR1 --> U4
  DR1 --> C1
  DR1 --> C2
```


## app/student/profile/page.tsx
```mermaid
flowchart TD
  SP1[profile/page.tsx] --> PB[components/ui/button]
  SP1 --> PC[components/ui/card]
  SP1 --> PI[components/ui/input]
  SP1 --> PL[components/ui/label]
  SP1 --> L1[lib/firebase]
  SP1 --> C1[context/AuthContext]
  SP1 --> C2[hooks/use-toast]
```


## app/student/skills/courses/page.tsx
```mermaid
flowchart TD
  S2[courses/page.tsx] --> U2[components/ui/card]
  S2 --> U1[components/ui/button]
```

## app/student/skills/path/page.tsx
```mermaid
flowchart TD
  S3[path/page.tsx] --> U2[components/ui/card]
  S3 --> U1[components/ui/button]
```

## app/student/skills/resume/page.tsx
```mermaid
flowchart TD
  S4[resume/page.tsx] --> U2[components/ui/card]
  S4 --> U1[components/ui/button]
```

## app/student/skills/interview/page.tsx
```mermaid
flowchart TD
  S5[interview/page.tsx] --> U2[components/ui/card]
  S5 --> U1[components/ui/button]
```

## app/student/skills/quiz/page.tsx
```mermaid
flowchart TD
  S6[quiz/page.tsx] --> U2[components/ui/card]
  S6 --> U1[components/ui/button]
```

## app/student/skills/questions/page.tsx
```mermaid
flowchart TD
  S7[questions/page.tsx] --> U2[components/ui/card]
  S7 --> U1[components/ui/button]
```

## app/student/skills/roadmap/page.tsx
```mermaid
flowchart TD
  S8[roadmap/page.tsx] --> U2[components/ui/card]
  S8 --> U1[components/ui/button]
```


## Overall app/* page-to-module map
```mermaid
flowchart TD
  subgraph Pages
    P1[dashboard/page.tsx]
    P2[dashboard/create/page.tsx]
    P3[dashboard/edit/[id]/page.tsx]
    P4[dashboard/results/page.tsx]
    P5[exam/[id]/page.tsx]
    P6[exam/[id]/verify/page.tsx]
    P7[exam/[id]/take/page.tsx]
    P8[student/dashboard/page.tsx]
    P9[student/dashboard/submission/[id]/page.tsx]
    P10[student/profile/page.tsx]
    P11[student/skills/page.tsx]
  end
  P1-->L[lib/firebase]
  P1-->U[components/ui/card]
  P2-->AI[ai/flows/generate-exam-questions.ts]
  P2-->L
  P2-->U
  P4-->L
  P4-->U
  P5-->L
  P5-->U
  P8-->L
  P8-->U
  P9-->L
  P9-->U
  P10-->L
  P10-->U
  P11-->L
  P11-->U
```

---
For further context and file responsibilities see `SRC_OVERVIEW.md` and `blueprint.md`. Add more graphs here as new feature folders/routes are added.
