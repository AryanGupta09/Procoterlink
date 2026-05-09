import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, ShieldCheck, Share2, Bot, Star, Server, Users, FileText, Briefcase, School, Award, FilePlus2, BarChart, ChevronDown } from 'lucide-react';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Logo } from '@/components/ui/logo';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
            <Link href="/" className="flex items-center justify-center" prefetch={false}>
              <Logo size="md" />
            </Link>
            <nav className="ml-auto hidden items-center gap-4 sm:flex">
                <Link href="#features" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">Features</Link>
                <Link href="#use-cases" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">Use Cases</Link>
                <Link href="#faq" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">FAQ</Link>
            </nav>
            <div className="ml-auto flex items-center gap-4 sm:ml-4">
              <Button asChild variant="outline">
                <Link href="/student/login">Student Login</Link>
              </Button>
              <Button asChild variant="default">
                <Link href="/login">Organizer Login</Link>
              </Button>
            </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_550px] lg:gap-12 xl:grid-cols-[1fr_650px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-4">
                  <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none font-headline">
                    The Gold Standard in Secure Online Examinations
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    ProctorLink offers a robust platform for creating, managing, and conducting secure online exams with AI-powered tools and advanced proctoring features.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button asChild size="lg" className="bg-brand-primary hover:bg-brand-dark text-white">
                    <Link href="/dashboard/create">Create Your First Exam</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href="#how-it-works">Learn More</Link>
                  </Button>
                </div>
              </div>
              <Image
                src="https://i.postimg.cc/8kfGbWwr/image.png"
                width="650"
                height="450"
                alt="Hero"
                data-ai-hint="online exam computer"
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last"
              />
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/40">
          <div className="container px-4 md:px-6">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <div className="text-center">
                <FileText className="mx-auto h-10 w-10 text-primary mb-4" />
                <h3 className="text-4xl font-bold">5,000+</h3>
                <p className="text-muted-foreground">Exams Taken</p>
              </div>
              <div className="text-center">
                 <Users className="mx-auto h-10 w-10 text-primary mb-4" />
                <h3 className="text-4xl font-bold">150+</h3>
                <p className="text-muted-foreground">Organizers Trust Us</p>
              </div>
              <div className="text-center">
                 <Server className="mx-auto h-10 w-10 text-primary mb-4" />
                <h3 className="text-4xl font-bold">99.9%</h3>
                <p className="text-muted-foreground">Uptime Guarantee</p>
              </div>
            </div>
          </div>
        </section>
        
        <section id="how-it-works" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm">How It Works</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Get Started in 3 Easy Steps</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Our platform is designed to be intuitive and straightforward, so you can focus on creating great exams, not on learning complex software.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-3 md:gap-12 mt-12">
              <div className="grid gap-1 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
                  <FilePlus2 className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold">1. Create & Customize</h3>
                <p className="text-muted-foreground">Use our intuitive builder to create exams. Add questions manually or generate them with AI.</p>
              </div>
               <div className="grid gap-1 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
                  <Share2 className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold">2. Share Securely</h3>
                <p className="text-muted-foreground">Generate a unique, secure link for each exam and share it with your participants.</p>
              </div>
               <div className="grid gap-1 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
                  <BarChart className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold">3. Analyze Results</h3>
                <p className="text-muted-foreground">View detailed results and analytics for each participant on your dashboard.</p>
              </div>
            </div>
          </div>
        </section>


        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-muted/40">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm">Key Features</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Everything You Need for Secure Testing</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  From AI question generation to advanced security measures, our platform is designed for a fair and cheat-proof exam experience.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-y-16">
              <div className="grid gap-6 md:grid-cols-2 md:items-center md:gap-12">
                  <Image src="https://i.postimg.cc/WpqDJdk5/image.png" data-ai-hint="artificial intelligence brain" alt="AI Feature" width={550} height={310} className="rounded-lg" />
                  <div className="space-y-4">
                      <div className="bg-primary/10 text-primary p-3 rounded-full w-fit">
                          <Bot className="w-6 h-6" />
                      </div>
                      <h3 className="text-2xl font-bold">AI-Powered Question Tool</h3>
                      <p className="text-muted-foreground">Save hours of work. Automatically generate relevant exam questions and descriptions based on any topic. Our AI is trained to create a variety of question styles to keep your exams engaging and effective.</p>
                  </div>
              </div>
              <div className="grid gap-6 md:grid-cols-2 md:items-center md:gap-12">
                  <div className="space-y-4 md:order-last">
                       <div className="bg-primary/10 text-primary p-3 rounded-full w-fit">
                          <ShieldCheck className="w-6 h-6" />
                      </div>
                      <h3 className="text-2xl font-bold">Advanced Proctoring Security</h3>
                      <p className="text-muted-foreground">Maintain the integrity of your exams. Our system restricts participants from switching tabs, copying/pasting content, and requires camera access to simulate a proctored environment, deterring cheating.</p>
                  </div>
                   <Image src="https://i.postimg.cc/PqLHFwhc/image.png" data-ai-hint="security shield computer" alt="Security Feature" width={550} height={310} className="rounded-lg" />
              </div>
            </div>
          </div>
        </section>
        
        <section id="use-cases" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
             <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm">Use Cases</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Designed for Every Need</h2>
                 <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  ProctorLink is versatile enough to support a wide range of assessment scenarios.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3">
              <Card className="hover:shadow-lg transition-shadow border-transparent hover:border-primary">
                <CardHeader className="flex flex-col items-center text-center gap-4">
                  <div className="bg-primary/10 p-4 rounded-full">
                    <Briefcase className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle>For Hiring Managers</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-muted-foreground">Efficiently screen job candidates with standardized technical assessments and coding challenges. Identify top talent faster.</p>
                </CardContent>
              </Card>
              <Card className="hover:shadow-lg transition-shadow border-transparent hover:border-primary">
                <CardHeader className="flex flex-col items-center text-center gap-4">
                  <div className="bg-primary/10 p-4 rounded-full">
                    <School className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle>For Educators</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-muted-foreground">Create engaging classroom quizzes, mid-terms, and final exams. Simplify your grading process and save valuable time.</p>
                </CardContent>
              </Card>
              <Card className="hover:shadow-lg transition-shadow border-transparent hover:border-primary">
                <CardHeader className="flex flex-col items-center text-center gap-4">
                  <div className="bg-primary/10 p-4 rounded-full">
                    <Award className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle>For Certification</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-muted-foreground">Deliver secure, high-stakes certification exams with confidence. Our platform ensures a fair and reliable testing environment.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 bg-card">
            <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
                <div className="space-y-3">
                    <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">What Our Users Are Saying</h2>
                    <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                        Don't just take our word for it. Here's what organizers think about ProctorLink.
                    </p>
                </div>
                <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-1 md:grid-cols-2 lg:gap-12 mt-8">
                    <Card className="text-left">
                        <CardHeader>
                            <div className="flex items-center gap-2 mb-2">
                                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400"/>
                                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400"/>
                                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400"/>
                                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400"/>
                                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400"/>
                            </div>
                            <blockquote className="text-lg font-semibold leading-snug">
                                “ProctorLink has revolutionized how we conduct our certification exams. The AI tools are a lifesaver, and the security features give us complete peace of mind.”
                            </blockquote>
                        </CardHeader>
                        <CardContent className="flex items-center gap-4">
                            <Avatar>
                                <AvatarImage src="https://placehold.co/40x40.png" data-ai-hint="person avatar"/>
                                <AvatarFallback>JD</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold">Jane Doe</p>
                                <p className="text-sm text-muted-foreground">Hiring Manager, TechCorp</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="text-left">
                        <CardHeader>
                            <div className="flex items-center gap-2 mb-2">
                                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400"/>
                                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400"/>
                                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400"/>
                                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400"/>
                                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400"/>
                            </div>
                            <blockquote className="text-lg font-semibold leading-snug">
                                “The setup was incredibly easy, and the ability to set timers per question has made our technical assessments far more effective. Highly recommended!”
                            </blockquote>
                        </CardHeader>
                        <CardContent className="flex items-center gap-4">
                             <Avatar>
                                <AvatarImage src="https://placehold.co/40x40.png" data-ai-hint="person avatar"/>
                                <AvatarFallback>MS</AvatarFallback>
                            </Avatar>
                             <div>
                                <p className="font-semibold">Michael Smith</p>
                                <p className="text-sm text-muted-foreground">Professor, InnovateU</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>

        <section id="faq" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container max-w-3xl px-4 md:px-6">
             <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm">FAQ</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Frequently Asked Questions</h2>
              </div>
            </div>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>Is ProctorLink secure?</AccordionTrigger>
                <AccordionContent>
                  Yes, security is our top priority. We employ multiple layers of protection, including tab and screen restrictions, copy-paste prevention, and mandatory camera monitoring to ensure the integrity of every exam.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>Can I use my own questions?</AccordionTrigger>
                <AccordionContent>
                  Absolutely! You can add all of your own questions and answers manually. The AI question generator is an optional tool to help you save time if you need it.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>What happens if a student's internet disconnects?</AccordionTrigger>
                <AccordionContent>
                  Our platform is designed to be resilient. If a student temporarily loses connection, their progress is saved. However, for security reasons, the exam timer continues to run.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger>Is there a limit to the number of exams or participants?</AccordionTrigger>
                <AccordionContent>
                 Our standard plans are very generous and suitable for most organizations. If you have very large-scale needs, please contact us for enterprise solutions.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 border-t bg-muted/40">
            <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
                <div className="space-y-3">
                    <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">Ready to Secure Your Exams?</h2>
                    <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                        Create an account and start building your first secure exam in minutes. No credit card required.
                    </p>
                </div>
                <div className="mx-auto w-full max-w-sm space-y-2">
                     <Button asChild size="lg" className="w-full">
                        <Link href="/signup">Get Started for Free</Link>
                    </Button>
                </div>
            </div>
        </section>

      </main>
      <footer className="flex flex-col gap-3 py-6 w-full shrink-0 items-center px-4 md:px-6 border-t bg-card">
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-brand-primary" />
            <span className="text-sm font-semibold text-brand-dark">ProctorLink</span>
          </div>
          <p className="text-xs text-brand-medium font-medium">Powered by LogikSutra AI Recruitment</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-center w-full">
          <p className="text-xs text-muted-foreground">&copy; 2024 ProctorLink. All rights reserved.</p>
          <nav className="sm:ml-auto flex gap-4 sm:gap-6">
            <Link href="/legal/terms" className="text-xs hover:underline underline-offset-4" prefetch={false}>
              Terms of Service
            </Link>
            <Link href="/legal/privacy" className="text-xs hover:underline underline-offset-4" prefetch={false}>
              Privacy
            </Link>
          </nav>
        </div>
        <div className="text-center">
          <p className="text-xs text-brand-primary/80 font-medium bg-brand-light/20 px-3 py-1 rounded-full">
            🚀 Powered by LogikSutra AI Recruitment - Advanced Proctoring Solutions
          </p>
        </div>
      </footer>
    </div>
  );
}
