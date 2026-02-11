# Job Curator

## Genesis

This is a project that I made to help my job search. When visiting a job post, I noticed that I would spend a minute or two reading about the company and the position, maybe get excited, only to see at the bottom that the technologies involved were completely irrelevant to me (e.g Angular) or that some other condition was a no-go.

Being at the peak of the A.I wave (2025-2026), and since everyone seems to be more (or less) productive with it, I thought I would give it a go. At the same time, I wanted a sizable project that would be a vessel for learning new technologies/patterns.

## Architecture

The project is made of a frontend Next.js application deployed on Vercel, and a Node.js server deployed on Heroku. The latter is containerized with Docker. It communicates with Mistral AI’s API (try to pronounce that 5 times fast!).

Authentication and DB are handled by Supabase, as it’s the quickest way to get up and running. It’s a pretty fantastic product in my opinion, the DX is amazing. They even generate TypeScript types for the tables that I plugged right into the code. However, it does abstract a lot and I do intend to migrate to custom services in the future.

## Flow

The Node.js server (`apps/backend`) has a double responsibility:

- Scrape job boards (Linkedin and Welcome to the Jungle at the moment)
- Analyze jobs (Mistral API) and send to the client

I had a little back and forth with this service’s role. Initially, the flow was very custom, in the sense that the user had full control over the search: it could be any type of job.

I realized the scope of the scraping was too ambitious and definitely not scalable. Very recently, I decided that instead of allowing any job to be scraped, I would limit it to my use case, and perhaps expand later down the road. The new flow is:

- Scrape job boards with cron and predetermined criteria (i.e developer jobs)
- Store them in DB
- Client sends job criteria to server
- Server analyzes jobs in the store with the user’s criteria
- Server returns the top N jobs

## Structure

Initially, the project was divided into two repos (front and back) but I wanted to get more familiar with a monorepo structure. Obviously, the monorepo becomes relevant as an application scales and this is definitely not the case here.

An interesting note here is that I managed to migrate in less than an hour and while preserving both repos’ history. Kudos to the maintainers of [git-filter-repo](https://github.com/newren/git-filter-repo), it’s truly an amazing tool!

As much as the monorepo is an artifice here, it does come with its perks, and the full-stack type-safety is much appreciated.

## Testing strategy

Section in construction

## Future

Most of the features I want to add are on the Frontend. First, I am not satisfied with its look right now. Regarding functionality, I want to add the capacity to track job applications, generate cover letters, maybe even CV parsing.
