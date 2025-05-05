[DE](DE%3AStatistics)

# Statistics and exports

An integral part of Lasius is the easy accessibility of statistics and exports of time bookings for further processing in third-party systems or manual control.

The statistics are pre-calculated by the Lasius backend for optimal performance and are made available to the frontend so that the user can consult them.

## Perspectives

A time booking is always assigned to the following four units:

- A user
- An organization
- A project
- Optionally, one or more tags and/or tag groups.

Based on these units, different views and exports of time bookings are available to the user, depending on their role within the project or organization.

### Statistics

#### User

Each user can view and export their own time bookings.

![User statistics layout](images/Lasius_Stats_User.png)

1. Displayed statistics can be filtered.
2. Total time bookings
3. Timeline of time bookings, grouped by projects or [tags](#tags)
4. Aggregated time bookings by projects
5. Aggregated time bookings by [tags](#tags)

#### Organization

The organization statistics include all time bookings recorded in the context of the selected organization. This includes time bookings from projects [shared with a user from another organization](Projects.md#inviting-users).

![Organization statistics layout](images/Lasius_Stats_Org.png)

1. Displayed statistics can be filtered.
2. Total time bookings
3. Timeline of time bookings, grouped by [tags](#tags) or users
4. Aggregated time bookings by projects or users
5. Aggregated time bookings by [tags](#tags)

#### Projects

Project statistics are available as pre-calculated data via API in the Lasius backend, but are not currently offered in the web application.

#### Tags

Statistics by [tags](Tags) show aggregated values of time bookings according to the assigned `tags`. Since a time booking can be assigned to one or more tags/tag groups, the value of the time booking is considered in **all** assigned tag aggregations.

This means that the sum of aggregated time bookings by tags does _not_ correspond to the sum of all time bookings, as the same time booking can be counted multiple times.

The statistics by tags are intended to show a relationship between individual `tags` (e.g., `Billable` vs. `Non-billable`).

### Exports

Based on the raw data, CSV exports of time bookings with different filters are available for the perspectives of user, organization, and project. These can be used, in particular, for further processing in third-party systems.
