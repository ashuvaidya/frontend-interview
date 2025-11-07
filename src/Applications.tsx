import SingleApplication from "./components/SingleApplication";
import styles from "./Applications.module.css";
import { Button } from "./ui/Button/Button";
import { useFetch } from "./hooks/useFetch";

const Applications = () => {
  const { data: applications, error, loading, paginationInfo, loadMore, refetch } = useFetch();

  if (error) {
    return (
      <div className={styles.error}>
        <div>Something went wrong!</div>
        <div>Message: {error}</div>
        <Button className="retry-button" onClick={refetch}>Retry</Button>
      </div>
    );
  }

  return (
    <>
      <div className={styles.Applications}>
        {applications?.map((app) => {
          return <SingleApplication key={app.id} application={app} />;
        })}
        {loading && applications.length === 0 && (
          <div>Loading...</div>
        )}
      </div>
      
      {applications.length > 0 && (
        <div className="button-container">
          <Button 
            id="load-more-applications" 
            className="load-more-button" 
            onClick={loadMore}
            disabled={loading || !paginationInfo.hasNext}
          >
            {loading ? 'Loading...' : 'Load More'}
          </Button>
          
          {!paginationInfo.hasNext && applications.length > 0 && (
            <p style={{ textAlign: 'center', marginTop: '10px', color: '#666' }}>
              No more applications to load
            </p>
          )}
        </div>
      )}
    </>
  );
};

export default Applications;
