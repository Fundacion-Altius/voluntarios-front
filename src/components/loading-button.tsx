import { Button } from "./ui/button";

interface LoadingButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading: boolean;
}

const LoadingButton: React.FC<LoadingButtonProps> = ({
  isLoading,
  children,
  ...props
}) => {
  return (
    <Button
      disabled={isLoading}
      {...props}
      style={{ position: "relative", opacity: isLoading ? 0.6 : 1 }}
    >
      {isLoading ? (
        <>
          <span className="animate-spin" style={{ marginRight: 8 }}>
            ⏳
          </span>
         <span className="animate-pulse"> Procesando...</span>
        </>
      ) : (
        children
      )}
    </Button>
  );
};

export default LoadingButton;
