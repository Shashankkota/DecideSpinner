"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, HelpCircle, Users, Lock, Share2, RotateCcw } from 'lucide-react';

interface HowItWorksModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const HowItWorksModal = ({ open, onOpenChange }: HowItWorksModalProps) => {
  const steps = [
    {
      number: 1,
      icon: HelpCircle,
      title: "Create Your Decision",
      description: "Type in your question or dilemma - anything from 'What should I have for lunch?' to 'Which project should I tackle first?'",
      detail: "Choose between Private (just for you) or Community (public voting) mode using the audience toggle."
    },
    {
      number: 2,
      icon: RotateCcw,
      title: "Spin for Your Answer",
      description: "Hit the Spin button and watch the decision spinner work its magic. The spinner uses a fair randomization algorithm to pick from your options.",
      detail: "Don't like the result? You can always spin again until you find the answer that feels right."
    },
    {
      number: 3,
      icon: Lock,
      title: "Private vs Community",
      description: "Private decisions are stored locally on your device only. Community decisions create shareable polls where others can vote anonymously.",
      detail: "Community polls show live voting results and help you make decisions with crowd wisdom."
    },
    {
      number: 4,
      icon: Share2,
      title: "Share Your Decisions",
      description: "Copy links to community polls, share via QR code, or embed polls on other websites.",
      detail: "All community votes are anonymous and results update in real-time as people participate."
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border border-border"
        aria-describedby="how-it-works-description"
      >
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-border">
          <DialogTitle className="text-xl font-heading font-semibold text-foreground">
            How Decision Spinner Works
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-6 w-6 p-0 hover:bg-secondary"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div id="how-it-works-description" className="space-y-6 py-4">
          <p className="text-muted-foreground leading-relaxed">
            Decision Spinner helps you make choices quickly and fairly, whether you're deciding alone or getting input from others.
          </p>

          <div className="space-y-6">
            {steps.map((step) => {
              const IconComponent = step.icon;
              return (
                <div 
                  key={step.number}
                  className="flex gap-4 p-4 rounded-lg bg-secondary/50 border border-border/50 transition-all duration-200 hover:bg-secondary/70"
                >
                  <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-semibold text-sm">
                    {step.number}
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <IconComponent className="h-5 w-5 text-primary" />
                      <h3 className="font-heading font-semibold text-foreground">
                        {step.title}
                      </h3>
                    </div>
                    
                    <p className="text-foreground leading-relaxed">
                      {step.description}
                    </p>
                    
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {step.detail}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 p-4 rounded-lg bg-accent/10 border border-accent/20">
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-accent-foreground mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-accent-foreground mb-2">
                  Community Features
                </h4>
                <p className="text-sm text-accent-foreground/80 leading-relaxed">
                  When you create a community decision, others can vote on your options anonymously. 
                  Results are tallied in real-time, giving you insights from the crowd to help make your choice.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-border">
          <Button 
            onClick={() => onOpenChange(false)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-6"
          >
            Got it!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};