import React from 'react';
import { Linkedin, Twitter, Facebook, Instagram, Mail, Phone, MapPin } from 'lucide-react';
import { branding } from '../config/branding';
import { Logo } from './Logo';

export const Footer: React.FC = () => {
  const socialIcons = {
    linkedin: Linkedin,
    twitter: Twitter,
    facebook: Facebook,
    instagram: Instagram,
  };

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Company Info */}
          <div>
            <Logo size="md" className="mb-4" />
            <p className="text-sm text-gray-600 mb-4">
              {branding.company.description}
            </p>

            {/* Contact Info */}
            <div className="space-y-2">
              {branding.contact.email && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Mail size={16} className="text-gray-400" />
                  <a
                    href={`mailto:${branding.contact.email}`}
                    className="hover:text-primary-600"
                  >
                    {branding.contact.email}
                  </a>
                </div>
              )}
              {branding.contact.phone && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Phone size={16} className="text-gray-400" />
                  <a
                    href={`tel:${branding.contact.phone}`}
                    className="hover:text-primary-600"
                  >
                    {branding.contact.phone}
                  </a>
                </div>
              )}
              {branding.contact.address && (
                <div className="flex items-start space-x-2 text-sm text-gray-600">
                  <MapPin size={16} className="text-gray-400 mt-0.5" />
                  <span>{branding.contact.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {branding.footer.links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gray-600 hover:text-primary-600"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Social Media & Newsletter */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Connect With Us</h3>

            {/* Social Icons */}
            <div className="flex space-x-4 mb-6">
              {Object.entries(branding.social).map(([platform, url]) => {
                if (!url) return null;
                const Icon = socialIcons[platform as keyof typeof socialIcons];
                return Icon ? (
                  <a
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-primary-600 transition-colors"
                    aria-label={platform}
                  >
                    <Icon size={20} />
                  </a>
                ) : null;
              })}
            </div>

            <p className="text-sm text-gray-600">
              Visit our website for more information about our services and solutions.
            </p>
            <a
              href={branding.company.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-2 text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              {branding.company.website.replace('https://', '')}
            </a>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-gray-200">
          <div className="flex flex-col items-center space-y-2 text-center">
            <p className="text-sm text-gray-500">
              {branding.footer.copyright}
            </p>
            {branding.footer.subtitle && (
              <p className="text-xs text-gray-400">
                {branding.footer.subtitle}
              </p>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
