// Native React page. Data contract: backoffice/tabs/install.
import { Fragment, cssStyle, text } from "@ui/runtime";
export default function Page({ data, state }) {
  return (
    <>
      {data.choice1 === 0 ? (
        <>
          <div className={"banner info"}>
            <span className={"ico"}>{"i"}</span>
            <div>
              {
                "Hardware-only sale: nothing to install. Delivery completes the sale."
              }
            </div>
          </div>
          {"\n"}
        </>
      ) : data.choice1 === 1 ? (
        <>
          <div className={"gate"}>
            {
              "The install job is scheduled automatically when the order is confirmed."
            }
          </div>
          {"\n"}
        </>
      ) : data.choice1 === 2 ? (
        <>
          {"\n"}
          <div className={"grid g-main"}>
            {"\n  "}
            <div className={"card"}>
              <div className={"card-h"}>
                <div className={"row"}>
                  <h2>{"Install job"}</h2>
                  <span className={"badge " + text(data.v2)}>{data.v3}</span>
                </div>
                <span className={"small muted"}>{data.v4}</span>
              </div>
              <div className={"card-b"}>
                {"\n    "}
                <div className={"row mb-s"}>
                  {data.choice5 === 0 ? (
                    <>
                      <span className={"badge b-green"}>
                        {"Customer confirmed the date"}
                      </span>
                    </>
                  ) : data.choice5 === 1 ? (
                    <>
                      <span className={"badge b-grey"}>
                        {"Customer has not confirmed"}
                      </span>
                    </>
                  ) : null}
                  {data.choice6 === 0 ? (
                    <>
                      <span className={"badge b-amber"}>
                        {"Reschedule asked: "}
                        {data.v7}
                      </span>
                    </>
                  ) : null}
                </div>
                {"\n    "}
                <dl className={"kv"}>
                  <dt>{"Crew"}</dt>
                  <dd>
                    {data.rows8?.length ? (
                      data.rows8.map((row8, index) => (
                        <Fragment key={index}>
                          {row8.v9}
                          {row8.choice10 === 0 ? <>{" (lead)"}</> : null}
                          {row8.choice11 === 0 ? <>{" ✓"}</> : null}
                          {row8.choice12 === 0 ? <>{", "}</> : null}
                        </Fragment>
                      ))
                    ) : (
                      <></>
                    )}
                  </dd>
                  {"\n    "}
                  {data.choice13 === 0 ? (
                    <>
                      <dt>{"Installed"}</dt>
                      <dd>
                        {data.v14}
                        {" kW in "}
                        {data.v15}
                        {" h ("}
                        {data.v16}
                        {")"}
                      </dd>
                      <dt>{"Generation test"}</dt>
                      <dd>
                        {data.v17}
                        {" kW"}
                      </dd>
                      <dt>{"Signed by"}</dt>
                      <dd>
                        {data.v18}
                        {" · "}
                        {data.v19}
                      </dd>
                      {data.choice20 === 0 ? (
                        <>
                          <dt>{"Size note"}</dt>
                          <dd>{data.v21}</dd>
                        </>
                      ) : null}
                    </>
                  ) : null}
                </dl>
                {"\n    "}
                {data.choice22 === 0 ? (
                  <>
                    <div className={"mt"}>
                      <a
                        className={"btn btn-primary"}
                        href={"/app/field/install/" + text(data.v23) + "/"}
                      >
                        {"Open the install form"}
                      </a>
                    </div>
                    {"\n    "}
                  </>
                ) : data.choice22 === 1 ? (
                  <>
                    <div className={"gate mt"}>
                      {
                        "The install form opens once the equipment is delivered."
                      }
                    </div>
                  </>
                ) : null}
                {"\n    "}
                {data.choice24 === 0 ? (
                  <>
                    <div className={"mt"}>
                      <a
                        className={"btn btn-line"}
                        href={"/doc/handover/" + text(data.v25) + "/"}
                      >
                        {"Handover certificate"}
                      </a>
                    </div>
                  </>
                ) : null}
                {"\n  "}
              </div>
            </div>
            {"\n  "}
            <div className={"card"}>
              <div className={"card-h"}>
                <h2>
                  {"Photos ("}
                  {data.v26}
                  {")"}
                </h2>
              </div>
              <div className={"card-b"}>
                <div className={"thumbs"}>
                  {data.rows27?.length ? (
                    data.rows27.map((row27, index) => (
                      <Fragment key={index}>
                        <a
                          className={"thumb"}
                          href={text(row27.v28)}
                          target={"_blank"}
                        >
                          <img src={text(row27.v29)} alt={""} />
                          <span className={"k"}>{row27.v30}</span>
                        </a>
                      </Fragment>
                    ))
                  ) : (
                    <>
                      <span className={"muted small"}>{"No photos yet."}</span>
                    </>
                  )}
                </div>
                {"\n    "}
                {data.choice31 === 0 ? (
                  <>
                    <hr />
                    <div className={"small muted"}>{"Customer signature"}</div>
                    <img
                      src={text(data.v32)}
                      alt={"signature"}
                      style={cssStyle(
                        "max-height:90px;background:#fff;border-radius:8px;padding:4px",
                      )}
                    />
                  </>
                ) : null}
              </div>
            </div>
            {"\n"}
          </div>
        </>
      ) : null}
      {"\n"}
    </>
  );
}
