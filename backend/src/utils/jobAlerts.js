import Alert from "../modules/productivity/alert.model.js";
import { notify } from "./notify.js";

// Notifies freelancers whose saved alert keywords match a newly posted Job or
// Project's title/skills. Runs after creation and never blocks or fails the
// request. `linkPrefix` is "jobs" or "projects" so the notification deep-links
// to the right details page for whichever collection `posting` came from.
export async function notifyMatchingAlerts(app, posting, linkPrefix = "jobs") {
  try {
    const haystack = `${posting.title} ${posting.skills.join(" ")}`.toLowerCase();
    const alerts = await Alert.find({ isActive: true, ...(posting.isRemote ? {} : { remoteOnly: false }) });

    const matched = alerts.filter((alert) => alert.keywords.some((kw) => haystack.includes(kw.toLowerCase())));

    await Promise.all(
      matched.map((alert) =>
        notify(app, {
          user: alert.user,
          type: "system",
          title: `New ${linkPrefix === "projects" ? "project" : "job"} matches your alert`,
          message: `"${posting.title}" at ${posting.companyName} matches your saved alert.`,
          link: `/${linkPrefix}/${posting._id}`,
        })
      )
    );
  } catch {
    // Alert matching is best-effort — never let it break job/project creation.
  }
}
