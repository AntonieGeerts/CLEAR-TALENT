/**
 * Branding Configuration
 * Update these values to match Clear Talent's brand identity
 */

export const branding = {
  // Company Information
  company: {
    name: 'CLEAR TALENT',
    fullName: 'CLEAR Leadership Consulting',
    tagline: 'Empowering Growth Through Performance',
    description: 'Performance Management & Development System (PMDS)',
    website: 'https://www.clear-talent.com',
  },

  // Logo Configuration
  logo: {
    // Actual logo URLs
    main: 'https://www.clear-talent.com/clear-logo.png',
    light: 'https://www.clear-talent.com/clear-logo.png',
    icon: 'https://www.clear-talent.com/clear-logo.png',
    alt: 'CLEAR TALENT Logo',

    // Fallback to text if logo not available
    useFallback: false, // Using actual logo now
  },

  // Color Scheme (update with brand colors)
  colors: {
    primary: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9', // Main brand color
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
    },
    // Add secondary, accent colors as needed
  },

  // Contact Information
  contact: {
    email: 'info@clear-talent.com',
    phone: '+1 (555) 123-4567', // Update with actual
    address: 'Your Address Here', // Update with actual
  },

  // Social Media Links
  social: {
    linkedin: 'https://linkedin.com/company/clear-talent', // Update with actual
    twitter: 'https://twitter.com/cleartalent', // Update with actual
    facebook: '', // Add if applicable
    instagram: '', // Add if applicable
  },

  // Footer Links
  footer: {
    links: [
      { label: 'About Us', href: 'https://www.clear-talent.com/about' },
      { label: 'Privacy Policy', href: 'https://www.clear-talent.com/privacy' },
      { label: 'Terms of Service', href: 'https://www.clear-talent.com/terms' },
      { label: 'Contact', href: 'https://www.clear-talent.com/contact' },
      { label: 'Support', href: 'https://www.clear-talent.com/support' },
    ],
    copyright: '© 2025 by CLEAR Leadership Consulting. All rights reserved.',
    subtitle: 'Performance Management & Development System (PMDS)',
    showPoweredBy: false,
  },

  // Metadata
  meta: {
    title: 'CLEAR TALENT - Performance Management System',
    description: 'AI-powered performance management and talent development platform',
    keywords: 'performance management, talent development, HR software, competency management, OKRs, IDPs',
  },
};

export default branding;
