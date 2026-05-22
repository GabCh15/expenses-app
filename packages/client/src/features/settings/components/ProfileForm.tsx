import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useCurrentUser } from "@/features/auth/api";
import { useUpdateProfile, useLinkTelegram } from "@/features/settings/api";
import { Check, Link as LinkIcon } from "lucide-react";

export function ProfileForm() {
  const { data: user } = useCurrentUser();
  const updateProfile = useUpdateProfile();
  const linkTelegram = useLinkTelegram();

  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [currency, setCurrency] = useState(user?.currency || "USD");
  const [telegramCode, setTelegramCode] = useState("");

  const handleSaveProfile = () => {
    updateProfile.mutate(
      { displayName, currency },
      {
        onSuccess: () => {
          toast.success("Profile updated successfully");
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "Failed to update profile");
        },
      }
    );
  };

  const handleLinkTelegram = () => {
    if (!telegramCode || telegramCode.length !== 6) {
      toast.error("Please enter a valid 6-character code");
      return;
    }
    linkTelegram.mutate(telegramCode, {
      onSuccess: () => {
        toast.success("Telegram linked successfully");
        setTelegramCode("");
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : "Failed to link Telegram");
      },
    });
  };

  return (
    <div className="space-y-6 max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user?.email || ""} disabled readOnly />
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">Default Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger id="currency">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="COP">COP</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleSaveProfile}
            disabled={updateProfile.isPending}
            className="mt-2"
          >
            {updateProfile.isPending ? "Saving..." : "Save Profile"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Telegram</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm">
            {user?.telegramLinked ? (
              <>
                <Check className="h-4 w-4 text-green-500" />
                <span>Linked</span>
              </>
            ) : (
              <>
                <span className="text-muted-foreground">Not linked</span>
              </>
            )}
          </div>

          {!user?.telegramLinked && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="telegramCode">Link Code</Label>
              <div className="flex gap-2">
                <Input
                  id="telegramCode"
                  placeholder="6-character code"
                  maxLength={6}
                  value={telegramCode}
                  onChange={(e) => setTelegramCode(e.target.value.toUpperCase())}
                  className="flex-1 uppercase"
                />
                <Button
                  onClick={handleLinkTelegram}
                  disabled={linkTelegram.isPending}
                  className="gap-2"
                >
                  <LinkIcon className="h-4 w-4" />
                  {linkTelegram.isPending ? "Linking..." : "Link"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
