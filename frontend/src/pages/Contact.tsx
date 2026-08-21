import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { Mail, Loader2, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { contactApi } from "@/api/contact";
import { useAuth } from "@/context/AuthContext";

export default function Contact() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const mutation = useMutation({
    mutationFn: () => contactApi.send({ name, email, subject, message }),
    onSuccess: () => setMessage(""),
  });

  return (
    <div className="bg-[#F7F8F5] py-16">
      <div className="container max-w-2xl">
        <div className="text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F1FFD6] text-[#3F6212]">
            <Mail className="h-6 w-6" />
          </span>
          <h1 className="mt-4 text-2xl font-bold text-[#111111]">Contact Us</h1>
          <p className="mt-2 text-sm text-[#6B7280]">
            Have a question, ran into an issue, or want to give feedback? Send us a message and we'll get back to you.
          </p>
        </div>

        {mutation.isSuccess ? (
          <div className="mt-8 flex flex-col items-center gap-2 rounded-[20px] border border-[#BBF7D0] bg-[#ECFDF3] py-10 text-center">
            <CheckCircle2 className="h-8 w-8 text-[#16A34A]" />
            <p className="text-sm font-medium text-[#16A34A]">Message sent — thanks for reaching out.</p>
          </div>
        ) : (
          <form
            className="mt-8 space-y-5 rounded-[20px] border border-[#E5E7EB] bg-white p-6"
            onSubmit={(e) => {
              e.preventDefault();
              mutation.mutate();
            }}
          >
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Your Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="subject">Subject (optional)</Label>
            <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="What's this about?" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us what's on your mind..."
              className="min-h-[140px]"
              required
            />
          </div>
          {mutation.isError && (
            <p className="text-sm text-danger">
              {isAxiosError(mutation.error) ? mutation.error.response?.data?.message : "Something went wrong. Please try again."}
            </p>
          )}
          <Button type="submit" variant="gradient" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Send Message
          </Button>
        </form>
        )}
      </div>
    </div>
  );
}
