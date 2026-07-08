export interface Project {
  id: string
  slug: string
  title: string
  description: string
  year: number
  category: 'project' | 'analysis' | 'research'
  image: string
  featured: boolean
  problem: string
  solution: string
  outcome: string
  technologies: string[]
  links: {
    github?: string
    live?: string
    writeup?: string
  }
  tags: string[]
}

export const projects: Project[] = [
  {
    id: 'iot-automation',
    slug: 'iot-automation-platform',
    title: 'IoT Automation Platform',
    description: 'Real-time device control & monitoring system for industrial applications',
    year: 2024,
    category: 'project',
    image: '/images/projects/iot-automation.png',
    featured: true,
    problem: 'Industrial facilities lacked a unified way to monitor and control IoT devices in real-time. Manual interventions were slow and error-prone.',
    solution: 'Built a distributed system with MQTT broker, WebSocket real-time updates, and an intuitive dashboard. Architected for scale with message queuing and persistence.',
    outcome: 'Reduced device response time from 3-5 minutes to <500ms. Enabled remote monitoring for 5+ facilities.',
    technologies: ['Node.js', 'MQTT', 'React', 'PostgreSQL', 'Docker', 'AWS'],
    links: {
      github: 'https://github.com/gabriel',
      writeup: 'https://medium.com/@gabriel',
    },
    tags: ['IoT', 'Real-time', 'Automation'],
  },
  {
    id: 'circuit-analyzer',
    slug: 'circuit-analyzer',
    title: 'Circuit Analyzer & Simulator',
    description: 'Web-based tool for analyzing electrical circuits with real-time visualization',
    year: 2024,
    category: 'project',
    image: '/images/projects/circuit-analyzer.png',
    featured: true,
    problem: 'Electrical engineering students needed an accessible tool to understand circuit behavior without expensive software.',
    solution: 'Developed a browser-based simulator using canvas rendering for real-time circuit visualization. Implemented nodal analysis and mesh current methods.',
    outcome: 'Used by 50+ students for learning. Open-sourced with 200+ GitHub stars.',
    technologies: ['React', 'Canvas API', 'TypeScript', 'Numerical Methods'],
    links: {
      github: 'https://github.com/gabriel/circuit-analyzer',
      live: 'https://circuit-analyzer.vercel.app',
    },
    tags: ['Electronics', 'Education', 'Simulation'],
  },
  {
    id: 'performance-bottleneck',
    slug: 'performance-bottleneck-analysis',
    title: 'Performance Bottleneck: Deep Dive',
    description: 'Analysis of a production API suffering from 2-second response times',
    year: 2024,
    category: 'analysis',
    image: '/images/projects/performance-analysis.png',
    featured: false,
    problem: 'A client\'s production API was consistently slow (2-3s responses). Traditional profiling missed the culprit.',
    solution: 'Used trace-based analysis to identify database query inefficiencies and N+1 problems. Implemented query batching and caching layer.',
    outcome: 'Response times dropped to 150ms. Eliminated 95% of database load.',
    technologies: ['PostgreSQL', 'Node.js', 'Profiling', 'Redis'],
    links: {
      writeup: 'https://medium.com/@gabriel/performance-deep-dive',
    },
    tags: ['Performance', 'Debugging', 'Optimization'],
  },
  {
    id: 'browser-rendering',
    slug: 'browser-rendering-pipeline',
    title: 'How Browser Rendering Actually Works',
    description: 'Visual walkthrough of the rendering pipeline, repaint/reflow, and optimization techniques',
    year: 2024,
    category: 'research',
    image: '/images/projects/rendering-pipeline.png',
    featured: false,
    problem: 'Frontend developers often don\'t understand why their animations are jank. Need for practical knowledge.',
    solution: 'Created interactive diagrams showing the rendering pipeline, memory layout, and how CSS changes trigger reflows.',
    outcome: 'Published as open educational content. 5k+ views. Became reference material.',
    technologies: ['Canvas', 'WebGL', 'Performance API', 'JavaScript'],
    links: {
      live: 'https://browser-rendering.vercel.app',
      github: 'https://github.com/gabriel/browser-rendering',
    },
    tags: ['Browser', 'Performance', 'Education'],
  },
  {
    id: 'robotics-project',
    slug: 'autonomous-robotics-arm',
    title: 'Autonomous Robotic Arm (Industry 4.0)',
    description: 'Designed and built a 6-DOF arm with vision feedback for precision assembly',
    year: 2023,
    category: 'project',
    image: '/images/projects/robotics-arm.png',
    featured: true,
    problem: 'Manual assembly was slow and error-prone. Need for automation in small factories.',
    solution: 'Designed arm kinematics, implemented PID control loops, integrated computer vision for object detection and positioning.',
    outcome: 'Prototype completed. 40% faster assembly time. Research published.',
    technologies: ['C++', 'OpenCV', 'ROS', 'CAD', 'Motor Control'],
    links: {
      writeup: 'https://medium.com/@gabriel/robotics-arm-design',
    },
    tags: ['Robotics', 'Hardware', 'AI/Vision'],
  },
  {
    id: 'ee-curriculum',
    slug: 'ee-learning-resources',
    title: 'EE Curriculum: Free Learning Resources',
    description: 'Curated collection of resources for learning electrical engineering, from basics to advanced topics',
    year: 2024,
    category: 'research',
    image: '/images/projects/ee-curriculum.png',
    featured: false,
    problem: 'Quality resources for EE self-learners are scattered and often paywalled.',
    solution: 'Built a searchable, categorized repository with video links, textbooks, problem sets, and community discussions.',
    outcome: 'Used by 1000+ students worldwide. Growing community contributions.',
    technologies: ['Next.js', 'Markdown', 'Vercel', 'GitHub'],
    links: {
      live: 'https://ee-curriculum.vercel.app',
      github: 'https://github.com/gabriel/ee-curriculum',
    },
    tags: ['Education', 'Open Source', 'EE'],
  },
]

export function getProject(slug: string): Project | undefined {
  return projects.find(p => p.slug === slug)
}

export function getFeaturedProjects(): Project[] {
  return projects.filter(p => p.featured).slice(0, 3)
}

export function getProjectsByCategory(category: string): Project[] {
  if (category === 'all') return projects
  return projects.filter(p => p.category === category)
}
