import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, XCircle, CreditCard } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function PaymentPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/payment/:action");
  const action = params?.action || "plans";

  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  // Fetch subscription plans
  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ["/api/subscription-plans"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/subscription-plans");
      return response.json();
    },
  });

  // Get user's organizations
  const { data: organizations } = useQuery({
    queryKey: ["/api/organizations"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/organizations");
      return response.json();
    },
    enabled: !!user,
  });

  // Get user's organization subscription
  const { data: subscriptionData } = useQuery({
    queryKey: ["/api/organizations/subscription", organizations?.[0]?.id],
    queryFn: async () => {
      if (!organizations || organizations.length === 0) return null;
      const orgId = organizations[0].id;
      const subResponse = await apiRequest("GET", `/api/organizations/${orgId}/subscription`);
      return subResponse.json();
    },
    enabled: !!user && !!organizations && organizations.length > 0,
  });

  // Create PayPal subscription mutation
  const createSubscriptionMutation = useMutation({
    mutationFn: async ({ planId, billingCycle }: { planId: number; billingCycle: "monthly" | "yearly" }) => {
      const response = await apiRequest("POST", "/api/paypal/create-subscription", {
        planId,
        billingCycle,
      });
      return response.json();
    },
    onSuccess: (data) => {
      // Redirect to PayPal approval URL
      if (data.approvalUrl) {
        window.location.href = data.approvalUrl;
      }
    },
  });

  // Handle payment success/cancel
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get("payment");
    
    if (paymentStatus === "success") {
      // Show success message
      setTimeout(() => {
        setLocation("/");
      }, 3000);
    } else if (paymentStatus === "error") {
      // Show error message
    }
  }, [setLocation]);

  if (action === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <CardTitle>Payment Successful!</CardTitle>
            <CardDescription>
              Your subscription has been activated. Redirecting...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (action === "cancel") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            </div>
            <CardTitle>Payment Cancelled</CardTitle>
            <CardDescription>
              Your payment was cancelled. You can try again anytime.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/payment/plans")} className="w-full">
              View Plans
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSubscribe = (planId: number) => {
    setSelectedPlanId(planId);
    createSubscriptionMutation.mutate({ planId, billingCycle });
  };

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const currentPlan = subscriptionData?.plan;

  return (
    <div className="min-h-screen bg-background p-4 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Choose Your Plan</h1>
          <p className="text-muted-foreground">
            Select the perfect plan for your organization
          </p>
        </div>

        {/* Billing Cycle Toggle */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-lg border border-input bg-background p-1">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                billingCycle === "monthly"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                billingCycle === "yearly"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Yearly
            </button>
          </div>
        </div>

        {plansLoading ? (
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans?.map((plan: any) => {
              const price = billingCycle === "yearly" 
                ? (plan.priceYearly || plan.priceMonthly * 12)
                : plan.priceMonthly;
              const isCurrentPlan = currentPlan?.id === plan.id;
              const isFree = plan.tier === "free";

              return (
                <Card
                  key={plan.id}
                  className={`relative ${
                    plan.tier === "professional" ? "border-primary border-2" : ""
                  }`}
                >
                  {plan.tier === "professional" && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold">
                        Most Popular
                      </span>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription>{plan.features?.description}</CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">
                        {isFree ? "Free" : formatPrice(price)}
                      </span>
                      {!isFree && (
                        <span className="text-muted-foreground">
                          /{billingCycle === "yearly" ? "year" : "month"}
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                        {plan.projectLimit} projects
                      </li>
                      <li className="flex items-center">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                        {plan.userLimit} users
                      </li>
                      <li className="flex items-center">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                        {plan.aiTokenLimit?.toLocaleString()} AI tokens/month
                      </li>
                      <li className="flex items-center">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                        {(plan.storageQuotaBytes / 1024 / 1024).toFixed(0)}MB storage
                      </li>
                    </ul>
                    <Button
                      className="w-full"
                      variant={isCurrentPlan ? "outline" : "default"}
                      disabled={isCurrentPlan || isFree || createSubscriptionMutation.isPending}
                      onClick={() => handleSubscribe(plan.id)}
                    >
                      {isCurrentPlan ? (
                        "Current Plan"
                      ) : isFree ? (
                        "Free Forever"
                      ) : createSubscriptionMutation.isPending && selectedPlanId === plan.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard className="mr-2 h-4 w-4" />
                          Subscribe with PayPal
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {createSubscriptionMutation.isError && (
          <Alert variant="destructive" className="mt-6 max-w-2xl mx-auto">
            <AlertDescription>
              {createSubscriptionMutation.error instanceof Error
                ? createSubscriptionMutation.error.message
                : "Failed to create subscription. Please try again."}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}

