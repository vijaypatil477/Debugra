import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-[#09090b] font-sans border-t border-[#27272a]">
      {/* Padding moved to this inner container so it cannot be overridden by global CSS */}
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 lg:gap-20 py-12 px-6 items-start">
        
        {/* Left Section: Branding & Socials */}
        <div className="flex flex-col space-y-6 lg:w-1/3">
          {/* Logo Section */}
          <div className="flex items-center space-x-3">
            <img 
              src="/icon-dark.svg" 
              alt="Debugra Logo" 
              className="w-8 h-8" 
            />
            <span className="text-white text-xl font-bold tracking-wide">
              Debugra
            </span>
          </div>
          
          {/* Description */}
          <p className="text-sm leading-relaxed text-[#a1a1aa] m-0 max-w-[42ch]">
            A modern, browser-based developer experience designed to streamline debugging and accelerate your workflow.
          </p>

          {/* Social Icons */}
          <div className="flex gap-4 pt-2">
            {/* GitHub */}
            <a href="https://github.com" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full border border-[#27272a] flex items-center justify-center !text-[#a1a1aa] !no-underline hover:!border-[#4EC9B0] hover:!text-[#4EC9B0] hover:bg-[#4EC9B0]/10 transition-all duration-200" aria-label="GitHub">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path><path d="M9 18c-4.51 2-5-2-7-2"></path></svg>
            </a>
            {/* Discord */}
            <a href="https://discord.com" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full border border-[#27272a] flex items-center justify-center !text-[#a1a1aa] !no-underline hover:!border-[#4EC9B0] hover:!text-[#4EC9B0] hover:bg-[#4EC9B0]/10 transition-all duration-200" aria-label="Discord">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
            </a>
            {/* X (Twitter) */}
            <a href="https://twitter.com" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full border border-[#27272a] flex items-center justify-center !text-[#a1a1aa] !no-underline hover:!border-[#4EC9B0] hover:!text-[#4EC9B0] hover:bg-[#4EC9B0]/10 transition-all duration-200" aria-label="X">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4l11.733 16h4.267l-11.733 -16z"></path><path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772"></path></svg>
            </a>
          </div>
        </div>

        {/* Right Section: Links Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 lg:w-2/3 lg:pl-8 text-left">
          
          {/* Product */}
            <div className="space-y-3">
            <h4 className="text-white font-semibold text-sm m-0">Product</h4>
            <ul className="space-y-2 text-sm m-0 p-0 list-none">
              <li><Link to="/dashboard" className="!text-[#a1a1aa] !no-underline hover:!text-white transition-colors block">Dashboard</Link></li>
              <li><Link to="/features" className="!text-[#a1a1aa] !no-underline hover:!text-white transition-colors block">Features</Link></li>
              <li><Link to="/demo" className="!text-[#a1a1aa] !no-underline hover:!text-white transition-colors block">Demo</Link></li>
              <li><Link to="/get-started" className="!text-[#a1a1aa] !no-underline hover:!text-white transition-colors block">Get Started</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-3">
            <h4 className="text-white font-semibold text-sm m-0">Support</h4>
            <ul className="space-y-2 text-sm m-0 p-0 list-none">
              <li><Link to="/report-issue" className="!text-[#a1a1aa] !no-underline hover:!text-white transition-colors block">Report Issue</Link></li>
              <li><Link to="/community" className="!text-[#a1a1aa] !no-underline hover:!text-white transition-colors block">Community</Link></li>
              <li><Link to="/docs" className="!text-[#a1a1aa] !no-underline hover:!text-white transition-colors block">Documentation</Link></li>
              <li><Link to="/contact" className="!text-[#a1a1aa] !no-underline hover:!text-white transition-colors block">Contact Us</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-3">
            <h4 className="text-white font-semibold text-sm m-0">Company</h4>
            <ul className="space-y-2 text-sm m-0 p-0 list-none">
              <li><Link to="/about" className="!text-[#a1a1aa] !no-underline hover:!text-white transition-colors block">About</Link></li>
              <li><Link to="/privacy" className="!text-[#a1a1aa] !no-underline hover:!text-white transition-colors block">Privacy Policy</Link></li>
              <li><Link to="/terms" className="!text-[#a1a1aa] !no-underline hover:!text-white transition-colors block">Terms of Service</Link></li>
              <li><Link to="/status" className="!text-[#a1a1aa] !no-underline hover:!text-white transition-colors block">Status</Link></li>
            </ul>
          </div>
          
        </div>
      </div>
    </footer>
  );
};

export default Footer;