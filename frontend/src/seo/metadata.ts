export type SeoMetadata = {
  title: string;
  description: string;
  robots: string;
  imagePath: string;
  type: 'website' | 'article';
  canonicalPath: string;
  keywords: string;
  structuredData?: Record<string, unknown> | Array<Record<string, unknown>>;
};

const defaultKeywords =
  'study abroad, scholarship support, university admission, visa guidance, work abroad, employment support, UK study, Canada jobs, Australia study';

const homeMetadata: SeoMetadata = {
  title: 'TrueMatch | Study Abroad, Scholarships & Work Abroad Opportunities',
  description:
    'TrueMatch supports students and professionals with university admissions, scholarship guidance, visa preparation, and work abroad opportunities in the UK, Canada, and Australia.',
  robots: 'index, follow',
  imagePath: '/social-preview.png',
  type: 'website',
  canonicalPath: '/',
  keywords: defaultKeywords,
  structuredData: [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'TrueMatch',
      description:
        'Education and employment agency helping students and professionals access global study and work opportunities.',
      areaServed: ['United Kingdom', 'Canada', 'Australia'],
      knowsAbout: [
        'University Admission',
        'Study Abroad',
        'Scholarship Guidance',
        'Visa Guidance',
        'Work Abroad Support'
      ]
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: 'Study Abroad and Work Abroad Advisory',
      serviceType: [
        'University Admission Support',
        'Document Review',
        'Visa Guidance',
        'Employment and Relocation Support'
      ],
      provider: {
        '@type': 'Organization',
        name: 'TrueMatch'
      },
      areaServed: ['United Kingdom', 'Canada', 'Australia']
    }
  ]
};

const applyMetadata: SeoMetadata = {
  title: 'Apply for Study or Work Abroad Programs | TrueMatch',
  description:
    'Start your TrueMatch application for study, scholarship, or work abroad pathways. Submit your details and get guided support from eligibility to next steps.',
  robots: 'index, follow',
  imagePath: '/social-preview.png',
  type: 'website',
  canonicalPath: '/apply',
  keywords: defaultKeywords
};

const loginMetadata: SeoMetadata = {
  title: 'Secure Sign In | TrueMatch Applicant Portal',
  description: 'Sign in to your TrueMatch account to track applications, messages, and next steps.',
  robots: 'noindex, nofollow',
  imagePath: '/social-preview.png',
  type: 'website',
  canonicalPath: '/login',
  keywords: 'truematch login, applicant portal, secure sign in'
};

const verifyEmailMetadata: SeoMetadata = {
  title: 'Verify Email | TrueMatch',
  description: 'Verify your email to secure your TrueMatch account and continue your application journey.',
  robots: 'noindex, nofollow',
  imagePath: '/social-preview.png',
  type: 'website',
  canonicalPath: '/verify-email',
  keywords: 'email verification, applicant portal'
};

const privateMetadata = (title: string, canonicalPath: string): SeoMetadata => ({
  title,
  description: 'Private account area for application tracking and communication.',
  robots: 'noindex, nofollow',
  imagePath: '/social-preview.png',
  type: 'website',
  canonicalPath,
  keywords: 'applicant dashboard, secure portal'
});

export const resolveSeoMetadata = (pathname: string): SeoMetadata => {
  const normalizedPath = pathname || '/';

  if (normalizedPath === '/') {
    return homeMetadata;
  }

  if (normalizedPath === '/apply') {
    return applyMetadata;
  }

  if (normalizedPath === '/login') {
    return loginMetadata;
  }

  if (normalizedPath === '/verify-email') {
    return verifyEmailMetadata;
  }

  if (normalizedPath.startsWith('/dashboard')) {
    return privateMetadata('Applicant Dashboard | TrueMatch', normalizedPath);
  }

  if (normalizedPath.startsWith('/admin')) {
    return privateMetadata('Admin Dashboard | TrueMatch', normalizedPath);
  }

  if (/^\/applications\/[^/]+(\/employment)?$/.test(normalizedPath)) {
    return privateMetadata('Application Details | TrueMatch', normalizedPath);
  }

  return {
    ...homeMetadata,
    title: 'TrueMatch | Study Abroad & Work Opportunities',
    canonicalPath: normalizedPath,
    structuredData: undefined
  };
};
