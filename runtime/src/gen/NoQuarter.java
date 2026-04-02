public class NoQuarter extends State {

    public NoQuarter(GumballMachine context) {
        super(context);
    }

    @Override
    public void onEntry() {
         System.out.println("Plesase insert coin..."); 
    }

    /** @prompt Print a message indicating that the machine is ready and the money was accepted */
    @Override
    public void insertQuarter() {
        if (true) {
         // generated start
        // generated end
            this.onExit();
            context.setState(new HasQuarter(context));
            context.getState().onEntry();
        }
}
    @Override
    public void abandon() {
        if (true) {
            this.onExit();
            context.setState(new TheEnd(context));
            context.getState().onEntry();
        }
}
}
