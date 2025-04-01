import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-neutral-200 py-3 px-4 md:px-6">
      <div className="flex flex-col md:flex-row justify-between items-center text-sm">
        <div className="text-neutral-500">
          <span>Salesforce Metadata Analyzer</span>
          <span className="mx-1">•</span>
          <span>Version 1.0.0</span>
        </div>
        <div className="mt-2 md:mt-0 flex space-x-4">
          <a href="#" className="text-neutral-600 hover:text-primary-500">Documentation</a>
          <a href="#" className="text-neutral-600 hover:text-primary-500">Support</a>
          <a href="#" className="text-neutral-600 hover:text-primary-500">Privacy Policy</a>
        </div>
      </div>
    </footer>
  );
}
