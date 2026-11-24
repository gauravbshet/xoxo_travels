import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Badge, Button, Card, CardBody, CardMedia, CardSkeleton, Tab, TabList, TabPanel, Tabs, VerifiedBadge } from "@/components/ui";

/* Design-token preview. Development only. */
export const metadata: Metadata = { title: "Tokens", robots: { index: false } };

export default function Page() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <main className="container-x py-12 space-y-12">
      <header className="space-y-3">
        <Badge tone="blue">Foundation · Step 1</Badge>
        <h1 className="text-5xl sm:text-6xl">Plan less. <span className="text-sky-500">Travel more.</span></h1>
        <p className="max-w-xl text-lg text-ink-soft">
          Display face, body face, six colour tokens and base components. Everything else builds on this.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-2xl">Colour</h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {[
            ["bg-paper", "Paper"], ["bg-cream", "Cream"], ["bg-sky-500", "Blue"],
            ["bg-coral-500", "Coral"], ["bg-leaf-500", "Green"], ["bg-sun-400", "Yellow"],
          ].map(([c, n]) => (
            <div key={n} className="space-y-1.5">
              <div className={`${c} h-16 rounded-md border border-line/60`} />
              <p className="text-xs font-medium text-ink-soft">{n}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl">Buttons</h2>
        <div className="flex flex-wrap gap-3">
          <Button>Search holidays</Button>
          <Button variant="coral">Grab offer</Button>
          <Button variant="secondary">Book now</Button>
          <Button variant="outline">View details</Button>
          <Button variant="ghost">Cancel</Button>
          <Button size="sm">Small</Button>
          <Button size="lg" href="/">Large link</Button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl">Badges</h2>
        <div className="flex flex-wrap gap-2">
          <Badge tone="blue">Domestic</Badge>
          <Badge tone="coral">20% off</Badge>
          <Badge tone="green">4 seats left</Badge>
          <Badge tone="yellow">Bestseller</Badge>
          <Badge>7N / 8D</Badge>
          <VerifiedBadge />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl">Tabs</h2>
        <Tabs defaultValue="holidays" className="space-y-4">
          <TabList label="Booking type" className="w-fit">
            <Tab value="holidays">Holidays</Tab>
            <Tab value="group">Group trips</Tab>
            <Tab value="dest">Destinations</Tab>
            <Tab value="partner">Find partner</Tab>
          </TabList>
          <TabPanel value="holidays"><p className="text-ink-soft">Holiday packages panel.</p></TabPanel>
          <TabPanel value="group"><p className="text-ink-soft">Group trips panel.</p></TabPanel>
          <TabPanel value="dest"><p className="text-ink-soft">Destinations panel.</p></TabPanel>
          <TabPanel value="partner"><p className="text-ink-soft">Find a travel partner panel.</p></TabPanel>
        </Tabs>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl">Cards</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <Card interactive flush>
            <CardMedia>
              <div className="h-full w-full bg-[linear-gradient(135deg,#070d1a,#16d69a)]" />
            </CardMedia>
            <CardBody className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-lg">Bali, Indonesia</h3>
                <Badge tone="coral">Offer</Badge>
              </div>
              <p className="text-sm text-ink-soft">5N / 6D · Flights included</p>
              <div className="flex items-end justify-between pt-1">
                <p className="tabular text-xl font-bold">₹48,999 <span className="text-sm font-medium text-ink-mute">/ person</span></p>
                <Button size="sm">View</Button>
              </div>
            </CardBody>
          </Card>
          <CardSkeleton />
          <Card className="glass">
            <h3 className="text-lg">Glass surface</h3>
            <p className="text-sm text-ink-soft">Used only for the nav and floating panels.</p>
          </Card>
        </div>
      </section>
    </main>
  );
}
