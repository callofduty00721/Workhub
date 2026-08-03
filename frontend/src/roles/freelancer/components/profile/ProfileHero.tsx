// roles/freelancer/components/profile/ProfileHero.tsx

import {
  BadgeCheck,
  Heart,
  MapPin,
  MessageSquare,
  Share2,
  Star,
} from "lucide-react";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ProfileHeroProps {
  freelancer: any;
  onHire: () => void;
  onMessage: () => void;
}

export default function ProfileHero({
  freelancer,
  onHire,
  onMessage,
}: ProfileHeroProps) {
  return (
    <section className="overflow-hidden rounded-[32px] border bg-white shadow-sm">

      {/* Cover */}

      <div className="relative h-72 w-full">

        {freelancer.coverImage ? (
          <img
            src={freelancer.coverImage}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-r from-slate-900 via-blue-700 to-indigo-700" />
        )}

      </div>

      <div className="px-10 pb-10">

        <div className="-mt-16 flex flex-col gap-8 lg:flex-row lg:justify-between">

          <div className="flex gap-6">

            <Avatar className="h-36 w-36 border-4 border-white shadow-xl">

              <AvatarImage src={freelancer.avatar} />

              <AvatarFallback>
                {freelancer.name?.charAt(0)}
              </AvatarFallback>

            </Avatar>

            <div className="pt-14">

              <div className="flex items-center gap-3">

                <h1 className="text-4xl font-bold text-slate-900">
                  {freelancer.name}
                </h1>

                <Badge className="rounded-full">
                  <BadgeCheck className="mr-1 h-4 w-4" />
                  Verified
                </Badge>

              </div>

              <p className="mt-2 text-lg text-slate-500">
                {freelancer.headline}
              </p>

              <div className="mt-5 flex flex-wrap gap-3">

                <Badge variant="outline">
                  <MapPin className="mr-1 h-4 w-4" />
                  {freelancer.location}
                </Badge>

                <Badge variant="outline">
                  <Star className="mr-1 h-4 w-4 fill-yellow-400 text-yellow-400" />
                  {freelancer.rating}
                </Badge>

                <Badge variant="outline">
                  ₹ {freelancer.hourlyRate}/hr
                </Badge>

              </div>

            </div>

          </div>

          <div className="flex items-end gap-3">

            <Button
              size="lg"
              className="rounded-xl px-8"
              onClick={onHire}
            >
              Hire Me
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="rounded-xl"
              onClick={onMessage}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Message
            </Button>

            <Button variant="outline" size="icon">
              <Heart className="h-4 w-4" />
            </Button>

            <Button variant="outline" size="icon">
              <Share2 className="h-4 w-4" />
            </Button>

          </div>

        </div>

      </div>

    </section>
  );
}