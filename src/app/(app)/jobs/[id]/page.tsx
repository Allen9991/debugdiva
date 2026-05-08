type JobDetailPageProps = {
  params: {
    id: string;
  };
};

export default function JobDetailPage({ params }: JobDetailPageProps) {
  return <div>Job detail placeholder for {params.id}.</div>;
}
